// CESI+ — service worker : récupère les cours et les rendus Moodle avec la session de l'utilisateur.
const MOODLE = 'https://moodle.cesi.fr';
const CAS_LOGIN = `${MOODLE}/login/index.php?authCAS=CAS`;
const CACHE_KEY = 'moodle';
const FRESH_MS = 5 * 60 * 1000;

let inflight = null;

const isMoodleLogin = (url) => {
  try {
    const u = new URL(url);
    return u.origin !== MOODLE || u.pathname.startsWith('/login/');
  } catch {
    return true;
  }
};

async function fetchPage(url) {
  const res = await fetch(url, { credentials: 'include', redirect: 'follow', cache: 'no-store' });
  return { url: res.url, text: await res.text() };
}

// Clé de session Moodle (sesskey), ou null si l'utilisateur n'est pas connecté à Moodle.
async function getSesskey() {
  let page = await fetchPage(`${MOODLE}/my/`);
  if (isMoodleLogin(page.url)) {
    // Connexion unique silencieuse via le CAS CESI (fonctionne si une session CESI est active).
    try {
      await fetchPage(CAS_LOGIN);
    } catch {}
    page = await fetchPage(`${MOODLE}/my/`);
    if (isMoodleLogin(page.url)) return null;
  }
  const match = page.text.match(/"sesskey":"([^"]+)"/);
  return match ? match[1] : null;
}

async function callMoodle(sesskey, calls) {
  const info = calls.map((c) => c.methodname).join(',');
  const res = await fetch(`${MOODLE}/lib/ajax/service.php?sesskey=${encodeURIComponent(sesskey)}&info=${encodeURIComponent(info)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(calls.map((c, index) => ({ index, ...c }))),
  });
  return res.json();
}

async function loadMoodle() {
  const sesskey = await getSesskey();
  if (!sesskey) return { status: 'login', fetchedAt: Date.now() };

  const now = Math.floor(Date.now() / 1000);
  const [courses, events] = await callMoodle(sesskey, [
    {
      methodname: 'core_course_get_enrolled_courses_by_timeline_classification',
      args: { offset: 0, limit: 0, classification: 'inprogress', sort: 'ul.timeaccess desc' },
    },
    {
      methodname: 'core_calendar_get_action_events_by_timesort',
      args: { limitnum: 20, timesortfrom: now - 7 * 86400, limittononsuspendedevents: true },
    },
  ]);

  if (courses?.error && events?.error) {
    return { status: 'error', message: courses.exception?.message || 'Moodle a refusé la requête', fetchedAt: Date.now() };
  }

  return {
    status: 'ok',
    fetchedAt: Date.now(),
    courses: (courses?.error ? [] : courses.data.courses).map((c) => ({
      id: c.id,
      name: c.fullname,
      short: c.shortname,
      category: c.coursecategory || '',
      url: c.viewurl,
      progress: c.hasprogress ? Math.round(c.progress) : null,
      favourite: !!c.isfavourite,
    })),
    events: (events?.error ? [] : events.data.events).map((e) => ({
      id: e.id,
      name: e.name,
      course: e.course?.fullname || '',
      courseId: e.course?.id || null,
      module: e.modulename || '',
      url: e.action?.url || e.url,
      action: e.action?.name || '',
      actionable: !!e.action?.actionable,
      time: e.timesort * 1000,
      overdue: !!e.overdue,
    })),
  };
}

async function refresh(force) {
  const { [CACHE_KEY]: cached } = await chrome.storage.local.get(CACHE_KEY);
  if (!force && cached?.status === 'ok' && Date.now() - cached.fetchedAt < FRESH_MS) return cached;
  if (!inflight) {
    inflight = loadMoodle()
      .catch((err) => ({ status: 'error', message: String(err?.message || err), fetchedAt: Date.now() }))
      .then(async (data) => {
        // On garde les dernières données valides si Moodle ne répond pas.
        if (data.status === 'ok' || !cached || cached.status !== 'ok') {
          await chrome.storage.local.set({ [CACHE_KEY]: data });
          return data;
        }
        return { ...cached, stale: true, lastStatus: data.status };
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

// Connexion à Moodle dans un onglet en arrière-plan (le CAS a besoin d'un vrai navigateur pour ses redirections).
// Si la connexion demande une action (mot de passe), l'onglet passe au premier plan.
function connectViaTab() {
  return new Promise((resolve) => {
    chrome.tabs.create({ url: CAS_LOGIN, active: false }, (tab) => {
      let done = false;
      const finish = async (connected) => {
        if (done) return;
        done = true;
        chrome.tabs.onUpdated.removeListener(onUpdated);
        clearTimeout(timer);
        if (connected) chrome.tabs.remove(tab.id).catch(() => {});
        else chrome.tabs.update(tab.id, { active: true }).catch(() => {});
        resolve(connected ? await refresh(true) : { status: 'login', fetchedAt: Date.now(), openedTab: true });
      };
      const onUpdated = (id, info, current) => {
        if (id !== tab.id || info.status !== 'complete' || !current.url) return;
        if (current.url.startsWith(MOODLE) && !isMoodleLogin(current.url)) finish(true);
      };
      chrome.tabs.onUpdated.addListener(onUpdated);
      const timer = setTimeout(() => finish(false), 15000);
    });
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.type === 'moodle:get') {
    refresh(!!msg.force).then(reply);
    return true;
  }
  if (msg?.type === 'moodle:connect') {
    connectViaTab().then(reply);
    return true;
  }
  return false;
});
