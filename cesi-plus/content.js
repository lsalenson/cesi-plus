// CESI+ — nouvelle interface de l'ENT, style « minimal épuré » (document_end)
(() => {
  const CX = globalThis.CX;
  if (!CX || window.top !== window) return;
  if (!document.body || document.body.id === 'cas') return; // pages de connexion : voir sso.js

  const root = document.documentElement;
  // Une seule copie active par page (évite deux copies qui se répondent après une mise à jour de l'extension).
  if (root.dataset.cxContent) return;
  root.dataset.cxContent = '2';
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const child of [].concat(children)) {
      if (child !== null && child !== undefined && child !== false) node.append(child);
    }
    return node;
  }

  const decoder = document.createElement('textarea');
  const decode = (s) => {
    decoder.innerHTML = s || '';
    return decoder.value;
  };

  // ---------- Icônes (traits fins, 24×24) ----------
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    chart: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    cap: '<path d="M2 9.5 12 5l10 4.5-10 4.5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9.5V15"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 8.5h6M7 12.5h10M7 16h10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    layers: '<path d="m12 3 9 4.5-9 4.5-9-4.5z"/><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2.2 2.2 4-4.2"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.6-1.5 1.7-2.2 3-2.2s2.4.7 3 2.2M14.5 10h4M14.5 13.5h4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20.5c1.2-3.6 4.3-5.5 8-5.5s6.8 1.9 8 5.5"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0"/>',
  };

  function icon(name, cls = '') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    if (cls) svg.setAttribute('class', cls);
    svg.innerHTML = ICONS[name] || ICONS.link;
    return svg;
  }

  function iconFor(label) {
    const t = norm(label);
    if (t.includes('accueil')) return 'home';
    if (t.includes('emploi du temps')) return 'calendar';
    if (t.includes('note')) return 'chart';
    if (t.includes('rechercher')) return 'search';
    if (t.includes('travaux') || t.includes('etudes')) return 'cap';
    if (t.includes('actualite')) return 'news';
    if (t.includes('info')) return 'info';
    if (t.includes('ressource')) return 'layers';
    if (t.includes('donnees')) return 'shield';
    if (t.includes('carte')) return 'card';
    if (t.includes('profil')) return 'user';
    if (t.includes('notification')) return 'bell';
    return 'link';
  }

  const label = (text, extra = '') => el('div', { class: `cx-label ${extra}`.trim(), text });
  // Couleur stable par matière (jaune, lavande, corail, pierre).
  const hueOf = (s) => {
    let h = 0;
    for (const ch of norm(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return String(h % 4);
  };
  const ZIGZAG = '<path d="M2 11 9 4l7 7 7-7 7 7 7-7 7 7"/>';
  const zigzag = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 48 15');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '3');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('class', 'cx-zigzag');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = ZIGZAG;
    return svg;
  };
  const pad2 = (n) => String(n).padStart(2, '0');
  const hhmm = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysFromToday = (d) => Math.round((startOfDay(d) - startOfDay(new Date())) / 864e5);

  const path = location.pathname.replace(/\/+$/, '') || '/';
  const isHome = document.body.classList.contains('accueil') || path === '/' || path.startsWith('/accueil');
  const loggedIn = !!$('#compte');
  const MOODLE = 'https://moodle.cesi.fr';
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  const KBD = mac ? '⌘K' : 'Ctrl K';

  // ---------- Stockage et messages (protégés si l'extension est rechargée) ----------
  const storeGet = (keys) =>
    new Promise((resolve) => {
      try {
        chrome.storage.local.get(keys, (res) => resolve(res || {}));
      } catch {
        resolve({});
      }
    });
  const storeSet = (obj) => {
    try {
      chrome.storage.local.set(obj);
    } catch {}
  };
  const ask = (msg) =>
    new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (res) => {
          void chrome.runtime.lastError;
          resolve(res || null);
        });
      } catch {
        resolve(null);
      }
    });

  // ---------- Menus déroulants ----------
  const openMenus = new Set();
  const closeMenus = (except) => openMenus.forEach((m) => m !== except && m.close());
  function dropdown(button, menu) {
    const api = {
      close() {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        openMenus.delete(api);
      },
      open() {
        closeMenus(api);
        menu.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        openMenus.add(api);
      },
    };
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden ? api.open() : api.close();
    });
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) api.close();
    });
    return api;
  }
  // Un seul menu ouvert à la fois : les nôtres (« Plus ») et ceux de l'ENT (compte, notifications).
  // Écoute en phase de capture, car l'ENT stoppe la propagation de ses clics.
  document.addEventListener(
    'click',
    (e) => {
      if (!e.target.closest('.cx-menu')) closeMenus();
      for (const box of $$('.cx-top .plier-deplier')) {
        const open = $(':scope > .plier-deplier__contenu:not(.plier-deplier__contenu--clos)', box);
        if (open && !box.contains(e.target)) $(':scope > .plier-deplier__bouton', box)?.click();
      }
    },
    true,
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenus();
  });

  // ---------- Barre du haut ----------
  function proxyLink(orig, text, ic) {
    const href = orig.getAttribute('href');
    const a = el('a', { href: href || '#' }, [icon(ic), el('span', { text: clean(text) })]);
    if (!href || orig.classList.contains('show-modal')) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenus();
        orig.click();
      });
    }
    return a;
  }

  function buildMoreMenu() {
    const items = $$('.sidebar-navigation > li.item');
    if (!items.length) return null;
    const wrap = el('div', { class: 'cx-more' });
    const shortcuts = [];
    for (const li of items) {
      const main = $(':scope > .sidebar-lien', li);
      if (!main) continue;
      const name = clean(main.textContent);
      const subs = $$('.sous-item a[href]', li);
      if (subs.length) wrap.append(el('div', {}, [label(name), ...subs.map((a) => proxyLink(a, a.textContent, iconFor(name)))]));
      else shortcuts.push(proxyLink(main, name, iconFor(name)));
    }
    if (shortcuts.length) wrap.prepend(el('div', {}, [label('Raccourcis'), ...shortcuts]));

    const button = el('button', { class: 'cx-link', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, ['Plus', icon('chevron', 'cx-caret')]);
    const menu = el('div', { class: 'cx-menu cx-menu--more', hidden: true }, wrap);
    dropdown(button, menu);
    return el('div', { style: 'position:relative' }, [button, menu]);
  }

  function buildTopbar() {
    if ($('.cx-top')) return;
    const brand = el('a', { class: 'cx-brand', href: '/', 'aria-label': 'Accueil de l’ENT' }, ['cesi', el('span', { class: 'cx-dot' })]);

    const links = el('div', { class: 'cx-links', role: 'navigation', 'aria-label': 'Navigation principale' });
    const link = (text, href, active) => el('a', { class: 'cx-link' + (active ? ' is-active' : ''), href, 'aria-current': active ? 'page' : null, text });
    if (loggedIn) {
      const courses = el('button', { class: 'cx-link', type: 'button', text: 'Cours' });
      courses.addEventListener('click', () => coursesPanel.open());
      links.append(
        link('Accueil', '/', isHome),
        link('Emploi du temps', '/mon-emploi-du-temps', path === '/mon-emploi-du-temps'),
        courses,
        link('Notes', '/mes-notes', path === '/mes-notes'),
      );
    }
    const more = buildMoreMenu();
    if (more) links.append(more);

    const searchBtn = el('button', { class: 'cx-searchbar', type: 'button', 'aria-label': `Recherche rapide (${KBD})` }, [
      icon('search'),
      el('span', { text: 'Rechercher' }),
      el('span', { class: 'cx-kbd', text: KBD }),
    ]);
    searchBtn.addEventListener('click', () => palette.open());
    const themeBtn = el('button', { class: 'cx-circle', type: 'button' });
    const paintTheme = () => {
      themeBtn.replaceChildren(icon(CX.isDark ? 'sun' : 'moon'));
      const text = CX.isDark ? 'Passer en mode clair' : 'Passer en mode sombre';
      themeBtn.title = text;
      themeBtn.setAttribute('aria-label', text);
    };
    themeBtn.addEventListener('click', () => CX.set({ theme: CX.isDark ? 'light' : 'dark' }));
    CX.onChange(paintTheme);
    paintTheme();

    const actions = el('div', { class: 'cx-top__actions' }, [searchBtn, themeBtn]);
    // On déplace les vrais boutons Notifications et Compte : leur fonctionnement d'origine est conservé.
    for (const id of ['notification', 'compte']) {
      const node = document.getElementById(id);
      if (node) actions.append(node);
    }

    // Une seule barre : logo · liens · recherche et compte.
    document.body.prepend(el('div', { class: 'cx-top cx-ui' }, el('div', { class: 'cx-top__in' }, [brand, links, actions])));
  }

  // ---------- Données Moodle ----------
  let moodle = null;
  let connecting = false;
  const moodleViews = new Set();
  const paintMoodle = () => moodleViews.forEach((fn) => fn());
  const moodleOk = () => moodle && (moodle.status === 'ok' || (moodle.stale && moodle.courses));

  async function loadMoodle(force = false) {
    if (!moodle) {
      const { moodle: cached } = await storeGet('moodle');
      if (cached && !moodle) {
        moodle = cached;
        paintMoodle();
      }
    }
    const fresh = await ask({ type: 'moodle:get', force });
    if (fresh) moodle = fresh;
    else if (!moodle) moodle = { status: 'error' };
    paintMoodle();
  }

  async function connectMoodle() {
    if (connecting) return;
    connecting = true;
    paintMoodle();
    const res = await ask({ type: 'moodle:connect' });
    connecting = false;
    moodle = res || { status: 'error' };
    if (res?.openedTab) {
      const onVisible = () => {
        if (document.visibilityState !== 'visible') return;
        document.removeEventListener('visibilitychange', onVisible);
        loadMoodle(true);
      };
      document.addEventListener('visibilitychange', onVisible);
    }
    paintMoodle();
  }

  function moodleState() {
    if (connecting) return el('div', { class: 'cx-state' }, [el('p', { text: 'Connexion à Moodle…' }), el('span', { class: 'cx-spin' })]);
    if (moodle?.status === 'login') {
      const btn = el('button', { class: 'cx-btn', type: 'button' }, ['Connecter Moodle', icon('arrow')]);
      btn.addEventListener('click', connectMoodle);
      const text = moodle.openedTab ? 'Termine la connexion dans l’onglet Moodle, puis reviens ici.' : 'Connecte Moodle pour voir tes cours et tes rendus ici.';
      return el('div', { class: 'cx-state' }, [el('p', { text }), btn]);
    }
    const btn = el('button', { class: 'cx-btn cx-btn--ghost', type: 'button' }, [icon('refresh'), 'Réessayer']);
    btn.addEventListener('click', () => {
      moodle = null;
      paintMoodle();
      loadMoodle(true);
    });
    return el('div', { class: 'cx-state' }, [el('p', { text: 'Moodle ne répond pas pour le moment.' }), btn]);
  }

  const skeleton = (n) => el('div', {}, Array.from({ length: n }, () => el('div', { class: 'cx-skel' })));

  function courseRow(c) {
    const name = decode(c.name);
    return el('li', {}, el('a', { class: 'cx-course', href: c.url, target: '_blank', rel: 'noopener', title: name }, [
      el('span', { class: 'cx-course__text' }, [el('span', { class: 'cx-course__name', text: name }), el('span', { class: 'cx-course__meta', text: decode(c.category) || 'Moodle' })]),
      el('span', { class: 'cx-go' }, icon('arrow')),
    ]));
  }

  function dueInfo(ev) {
    const d = new Date(ev.time);
    const late = ev.overdue || ev.time < Date.now();
    const days = daysFromToday(d);
    const cls = late ? 'is-late' : days <= 3 ? 'is-soon' : '';
    const top = late ? 'retard' : days === 0 ? 'auj.' : days === 1 ? 'demain' : `J-${days}`;
    return { d, late, days, cls, top };
  }

  function taskRow(ev) {
    const { d, cls, top } = dueInfo(ev);
    const name = decode(ev.name).replace(/\s+(doit être rendu|est dû|is due)$/i, '');
    return el('li', {}, el('a', { class: 'cx-task', href: ev.url || `${MOODLE}/calendar/view.php?view=upcoming`, target: '_blank', rel: 'noopener', title: decode(ev.name) }, [
      el('span', { class: 'cx-task__name', text: name }),
      el('span', { class: `cx-due ${cls}`.trim() }, [el('b', { text: String(d.getDate()) }), d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')]),
      el('span', { class: 'cx-task__course', text: `${top} · ${hhmm(d)} · ${decode(ev.course)}` }),
    ]));
  }

  // ---------- Fenêtre « Mes cours » ----------
  const coursesPanel = (() => {
    let overlay, input, body;
    function build() {
      input = el('input', { class: 'cx-panel__input', type: 'text', placeholder: 'Filtrer mes cours…', 'aria-label': 'Filtrer mes cours', autocomplete: 'off', spellcheck: 'false' });
      body = el('div', { class: 'cx-panel__body' });
      overlay = el('div', { class: 'cx-overlay cx-ui', hidden: true },
        el('div', { class: 'cx-panel cx-panel--wide', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Mes cours Moodle' }, [
          el('div', { class: 'cx-panel__head' }, [icon('book'), input, el('a', { class: 'cx-btn cx-btn--ghost', href: `${MOODLE}/my/courses.php`, target: '_blank', rel: 'noopener' }, ['Moodle', icon('external')])]),
          body,
        ]));
      document.body.append(overlay);
      overlay.addEventListener('mousedown', (e) => e.target === overlay && close());
      overlay.addEventListener('keydown', (e) => e.key === 'Escape' && close());
      input.addEventListener('input', render);
      moodleViews.add(() => !overlay.hidden && render());
    }
    function render() {
      if (!moodle) return body.replaceChildren(skeleton(6));
      if (!moodleOk()) return body.replaceChildren(moodleState());
      const q = norm(input.value);
      const list = moodle.courses.filter((c) => !q || q.split(/\s+/).every((w) => norm(decode(c.name) + ' ' + decode(c.category)).includes(w)));
      body.replaceChildren(list.length ? el('ul', { class: 'cx-courses' }, list.map(courseRow)) : el('div', { class: 'cx-empty', text: 'Aucun cours ne correspond.' }));
    }
    function open() {
      if (!overlay) build();
      overlay.hidden = false;
      input.value = '';
      render();
      input.focus();
      loadMoodle(false);
    }
    function close() {
      if (overlay) overlay.hidden = true;
    }
    return { open, close };
  })();

  // ---------- Accueil ----------
  const MONTHS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
  function parseDay(text) {
    const m = norm(text).match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
    if (!m) return null;
    const month = MONTHS.indexOf(m[2]);
    return month < 0 ? null : new Date(+m[3], month, +m[1]);
  }
  function atTime(day, text) {
    const m = (text || '').match(/(\d{1,2})[:h](\d{2})/);
    return day && m ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), +m[1], +m[2]) : null;
  }
  function dayLabel(day) {
    const diff = daysFromToday(day);
    if (diff === 0) return 'Aujourd’hui';
    if (diff === 1) return 'Demain';
    return day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function duration(min) {
    if (!(min > 0)) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h} h${m ? ' ' + pad2(m) : ''}` : `${m} min`;
  }
  function weekNumber(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  }

  function enhanceSessions() {
    const list = $('.emploiDuTemps__liste');
    if (!list) return [];
    $$('.cx-day, .cx-item-end', list).forEach((n) => n.remove());
    const now = new Date();
    let lastDay = null;
    return $$('.emploiDuTemps__item', list).map((item) => {
      const day = parseDay($('.emploiDuTemps__item__jour', item)?.textContent);
      const startText = clean($('.emploiDuTemps__item__horaire--debut', item)?.textContent);
      const endText = clean($('.emploiDuTemps__item__horaire--fin', item)?.textContent);
      const title = clean($('.emploiDuTemps__item__intitule', item)?.textContent);
      const s = { day, start: atTime(day, startText), end: atTime(day, endText), startText, endText, title };
      if (day && (!lastDay || +lastDay !== +day)) {
        item.before(el('li', { class: 'cx-day', text: dayLabel(day) }));
        lastDay = day;
      }
      const live = s.start && s.end && s.start <= now && now < s.end;
      const done = s.end && s.end <= now;
      item.dataset.cxHue = hueOf(title);
      item.classList.toggle('cx-now', !!live);
      item.classList.toggle('cx-done', !!done);
      const mins = s.start && s.end ? Math.round((s.end - s.start) / 6e4) : 0;
      item.append(el('span', { class: 'cx-item-end' }, live ? el('span', { class: 'cx-live', text: 'en cours' }) : duration(mins)));
      return s;
    });
  }

  function renderNow(tile, sessions) {
    const now = new Date();
    const live = sessions.find((s) => s.start && s.end && s.start <= now && now < s.end);
    const upcoming = sessions.filter((s) => s.start && s.start > now);
    const main = live || upcoming[0];
    const after = live ? upcoming[0] : upcoming[1];
    const parts = [el('span', { class: 'cx-circle-deco', 'aria-hidden': 'true' })];

    if (!main) {
      parts.push(el('div', {}, [el('span', { class: 'cx-tag cx-tag--yellow', text: 'Tranquille' }), el('h3', { class: 'cx-now__title', text: 'Rien de prévu.' })]));
      tile.replaceChildren(...parts);
      return;
    }
    const meta = live
      ? `${live.startText} – ${live.endText} · fin dans ${duration(Math.round((live.end - now) / 6e4))}`
      : `${dayLabel(main.day)} · ${main.startText} – ${main.endText}`;
    parts.push(
      el('div', {}, [
        el('span', { class: 'cx-tag cx-tag--yellow' }, live ? el('span', { class: 'cx-live', text: 'Maintenant' }) : 'Prochain cours'),
        el('h3', { class: 'cx-now__title', text: main.title }),
        el('div', { class: 'cx-now__meta', text: meta }),
      ]),
    );
    if (live) {
      const pct = Math.min(100, Math.max(0, ((now - live.start) / (live.end - live.start)) * 100));
      parts.push(el('span', { class: 'cx-now__bar' }, el('i', { style: `width:${pct.toFixed(1)}%` })));
    }
    if (after) {
      parts.push(el('div', { class: 'cx-now__next' }, [el('b', { text: `Ensuite · ${after.title}` }), el('span', { text: daysFromToday(after.day) === 0 ? after.startText : `${dayLabel(after.day).toLowerCase()} ${after.startText}` })]));
    }
    tile.replaceChildren(...parts);
  }

  function tileHead(title, action) {
    return el('div', { class: 'cx-tile__head' }, [el('h2', { class: 'cx-tile__title' }, [title, el('span', { class: 'cx-dot' })]), action || null]);
  }

  function buildHome() {
    if (!isHome || !loggedIn) return;
    const host = $('#sans_encadres') || $('#page_deco');
    if (!host || $('.cx-bento')) return;

    const first = clean($('#compte .session_libelle')?.textContent).split(' ')[0] || '';
    const name = first ? first[0].toUpperCase() + first.slice(1).toLowerCase() : '';
    const now = new Date();
    const hello = now.getHours() >= 18 || now.getHours() < 5 ? 'Bonsoir' : 'Salut';
    const dateTag = `${now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })} · sem. ${weekNumber(now)}`;

    // Tuile jaune : bonjour
    const helloSub = el('p', { class: 'cx-hello__sub' });
    const coursesBtn = el('button', { class: 'cx-btn cx-btn--cream', type: 'button' }, [icon('book'), 'Mes cours']);
    coursesBtn.addEventListener('click', () => coursesPanel.open());
    const helloTile = el('section', { class: 'cx-tile cx-tile--yellow cx-hello cx-area-hello' }, [
      el('span', { class: 'cx-blob', 'aria-hidden': 'true' }),
      el('div', { class: 'cx-hello__top' }, [el('span', { class: 'cx-tag', text: dateTag }), zigzag()]),
      el('div', {}, [el('h1', { class: 'cx-hello__title' }, [name ? `${hello} ${name}` : hello, el('span', { class: 'cx-dot' })]), helloSub]),
      el('div', { class: 'cx-hello__actions' }, [el('a', { class: 'cx-btn', href: '/mon-emploi-du-temps' }, [icon('calendar'), 'Emploi du temps']), coursesBtn]),
    ]);

    // Tuile anthracite : maintenant / prochain cours
    const nowTile = el('section', { class: 'cx-tile cx-tile--dark cx-now cx-area-now' });

    // Tuile crème : prochains cours (le vrai bloc de l'ENT, rempli en différé)
    const seances = $('.prochaines-seances');
    const edtTile = el('section', { class: 'cx-tile cx-tile--cream cx-area-edt' }, [
      tileHead('Cours', el('a', { class: 'cx-btn cx-btn--sm', href: '/mon-emploi-du-temps' }, ['Semaine', icon('arrow')])),
      seances || el('div', { class: 'cx-state' }, el('p', { text: 'Emploi du temps indisponible.' })),
    ]);

    // Tuile pierre : à rendre (Moodle)
    const tasksBody = el('div');
    const todoTile = el('section', { class: 'cx-tile cx-tile--stone cx-area-todo' }, [
      tileHead('À rendre', el('a', { class: 'cx-btn cx-btn--sm', href: `${MOODLE}/calendar/view.php?view=upcoming`, target: '_blank', rel: 'noopener' }, ['Moodle', icon('external')])),
      tasksBody,
    ]);

    // Tuile corail : chiffre clé
    const statNum = el('div', { class: 'cx-stat__num', text: '–' });
    const statTxt = el('div', { class: 'cx-stat__txt', text: 'rendus à venir' });
    const statTile = el('section', { class: 'cx-tile cx-tile--coral cx-stat cx-area-stat' }, [el('span', { class: 'cx-tag cx-tag--cream', style: '--cx-tilt:3deg', text: 'Moodle' }), statNum, statTxt]);

    // Tuile lavande : cours Moodle
    const allBtn = el('button', { class: 'cx-btn cx-btn--sm', type: 'button' }, ['Tous les cours', icon('arrow')]);
    allBtn.addEventListener('click', () => coursesPanel.open());
    const coursesBody = el('div');
    const coursesTile = el('section', { class: 'cx-tile cx-tile--lilac cx-area-courses' }, [tileHead('Tes cours', allBtn), coursesBody]);

    // Tuile blanche : accès directs
    const tools = $('.lienaccesdirect');
    const toolsTile = tools ? el('section', { class: 'cx-tile cx-tile--white cx-area-tools' }, [tileHead('Accès directs'), tools]) : null;

    const bento = el('div', { class: 'cx-bento cx-ui' }, [helloTile, nowTile, edtTile, todoTile, statTile, coursesTile, toolsTile]);
    host.prepend(bento);
    document.body.classList.add('cx-home');

    moodleViews.add(() => {
      if (!moodle) {
        tasksBody.replaceChildren(skeleton(3));
        coursesBody.replaceChildren(skeleton(3));
        return;
      }
      if (!moodleOk()) {
        tasksBody.replaceChildren(moodleState());
        coursesBody.replaceChildren(el('div', { class: 'cx-state' }, el('p', { text: moodle.status === 'login' ? 'Tes cours Moodle s’afficheront ici.' : 'Cours indisponibles pour le moment.' })));
        statNum.textContent = '–';
        statTxt.replaceChildren('rendus à venir');
        return;
      }
      const events = [...moodle.events].sort((a, b) => a.time - b.time);
      tasksBody.replaceChildren(
        events.length
          ? el('ul', { class: 'cx-tasks' }, events.slice(0, 4).map(taskRow))
          : el('div', { class: 'cx-state' }, el('p', { text: 'Rien à rendre pour le moment.' })),
      );
      coursesBody.replaceChildren(
        moodle.courses.length
          ? el('ul', { class: 'cx-courses' }, moodle.courses.slice(0, 8).map(courseRow))
          : el('div', { class: 'cx-state' }, el('p', { text: 'Aucun cours en cours sur Moodle.' })),
      );
      allBtn.replaceChildren(`Tous les cours (${moodle.courses.length})`, icon('arrow'));
      statNum.textContent = String(events.length);
      const next = events.find((e) => !dueInfo(e).late);
      statTxt.replaceChildren(
        events.length > 1 ? 'rendus à venir' : 'rendu à venir',
        next ? el('small', { text: `prochain : ${new Date(next.time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` }) : null,
      );
    });
    paintMoodle();
    loadMoodle(false);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && loadMoodle(false));

    const refresh = () => {
      const sessions = enhanceSessions();
      renderNow(nowTile, sessions);
      const today = sessions.filter((s) => s.day && daysFromToday(s.day) === 0);
      const left = today.filter((s) => s.end && s.end > new Date()).length;
      helloSub.replaceChildren(
        ...(today.length
          ? left
            ? ['Encore ', el('b', { text: `${left} cours` }), ' aujourd’hui.']
            : ['Fini pour aujourd’hui, ', el('b', { text: 'bien joué' }), '.']
          : ['Pas de cours aujourd’hui.']),
      );
    };
    refresh();
    // Les séances sont chargées en différé par l'ENT.
    if (seances) {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        refresh();
        observer.observe(seances, { childList: true, subtree: true });
      });
      observer.observe(seances, { childList: true, subtree: true });
    }
    setInterval(refresh, 60_000);
  }

  // ---------- Emploi du temps : une couleur par matière ----------
  function colorCalendar() {
    const wrap = $('.js-calendar__wrapper');
    if (!wrap) return;
    const paint = () => {
      for (const ev of $$('.fc-event', wrap)) {
        const hue = hueOf($('.fc-title', ev)?.textContent);
        if (ev.dataset.cxHue !== hue) ev.dataset.cxHue = hue;
      }
    };
    paint();
    new MutationObserver(paint).observe(wrap, { childList: true, subtree: true });
  }

  // ---------- Recherche rapide (⌘K) ----------
  const TOOLS_KEY = 'cx-links';
  function cacheTools() {
    const tools = $$('.lienaccesdirect a[href]').map((a) => ({ label: clean($('span', a)?.textContent || a.title), href: a.href }));
    if (!tools.length) return;
    try {
      localStorage.setItem(TOOLS_KEY, JSON.stringify(tools));
    } catch {}
  }

  function collectLinks() {
    const seen = new Set();
    const out = [];
    const add = (text, href, group, opts = {}) => {
      text = clean(text);
      if (!text || !href || href.endsWith('#') || /\/identification\//.test(href) || seen.has(href)) return;
      seen.add(href);
      out.push({ label: text, href, group, ...opts });
    };
    add('Accueil', `${location.origin}/`, 'Navigation');
    add('Emploi du temps', `${location.origin}/mon-emploi-du-temps`, 'Navigation');
    add('Mes notes', `${location.origin}/mes-notes`, 'Navigation');
    for (const a of $$('.sidebar-navigation a[href]')) {
      if (!a.classList.contains('show-modal') && a.getAttribute('href')) add(a.textContent, a.href, 'Navigation');
    }
    for (const a of $$('#compte .plier-deplier__contenu a[href]')) add(a.textContent, a.href, 'Mon compte');
    for (const c of moodle?.courses || []) add(decode(c.name), c.url, 'Cours Moodle', { external: true, icon: 'book' });
    try {
      for (const t of JSON.parse(localStorage.getItem(TOOLS_KEY) || '[]')) add(t.label, t.href, 'Accès directs', { external: true });
    } catch {}
    return out;
  }

  const palette = (() => {
    let overlay, input, list;
    let items = [];
    let shown = [];
    let index = 0;

    function build() {
      input = el('input', { class: 'cx-panel__input', type: 'text', placeholder: 'Rechercher une page, un cours, un outil…', 'aria-label': 'Recherche rapide', autocomplete: 'off', spellcheck: 'false' });
      list = el('ul', { class: 'cx-list', role: 'listbox' });
      overlay = el('div', { class: 'cx-overlay cx-ui', hidden: true },
        el('div', { class: 'cx-panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Recherche rapide' }, [
          el('div', { class: 'cx-panel__head' }, [icon('search'), input, el('span', { class: 'cx-kbd', text: 'Échap' })]),
          el('div', { class: 'cx-panel__body' }, list),
        ]));
      document.body.append(overlay);
      overlay.addEventListener('mousedown', (e) => e.target === overlay && close());
      input.addEventListener('input', () => render(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (shown.length) select((index + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          go(shown[index]);
        } else if (e.key === 'Escape') {
          close();
        }
      });
    }

    function render(query) {
      const q = norm(query);
      shown = items.filter((it) => !q || q.split(/\s+/).every((w) => norm(it.label).includes(w)));
      if (!q) shown = shown.filter((it) => it.group !== 'Cours Moodle').concat(shown.filter((it) => it.group === 'Cours Moodle').slice(0, 5));
      list.replaceChildren();
      if (!shown.length) {
        list.append(el('li', { class: 'cx-empty', text: 'Aucun résultat.' }));
        return;
      }
      let group = null;
      shown.forEach((it, i) => {
        if (it.group !== group) {
          group = it.group;
          list.append(el('li', { class: 'cx-label', text: group }));
        }
        const row = el('li', { class: 'cx-list__item', role: 'option' }, [
          icon(it.icon || (it.external ? 'external' : iconFor(it.label))),
          el('span', { text: it.label }),
          it.external ? el('small', { text: 'Nouvel onglet' }) : null,
        ]);
        row.addEventListener('mousemove', () => select(i));
        row.addEventListener('click', () => go(it));
        it.row = row;
        list.append(row);
      });
      select(0);
    }

    function select(i) {
      index = i;
      shown.forEach((it, n) => it.row.setAttribute('aria-selected', String(n === i)));
      shown[i]?.row.scrollIntoView({ block: 'nearest' });
    }

    function go(it) {
      if (!it) return;
      close();
      if (it.external) window.open(it.href, '_blank', 'noopener');
      else location.assign(it.href);
    }

    async function open() {
      if (!overlay) build();
      if (!moodle) moodle = (await storeGet('moodle')).moodle || null;
      items = collectLinks();
      overlay.hidden = false;
      input.value = '';
      render('');
      input.focus();
    }

    function close() {
      if (overlay) overlay.hidden = true;
    }

    return { open, close, toggle: () => (overlay && !overlay.hidden ? close() : open()) };
  })();

  // ---------- Session : déconnexion volontaire et reprise après reconnexion ----------
  function trackSession() {
    if (!loggedIn) return false;
    try {
      const resume = sessionStorage.getItem('cx-resume');
      if (resume) {
        sessionStorage.removeItem('cx-resume');
        const target = new URL(resume, location.origin);
        if (isHome && target.origin === location.origin && target.pathname !== location.pathname) {
          location.replace(target.href);
          return true;
        }
      }
    } catch {}
    storeSet({ cxLastPage: { url: location.href, ts: Date.now() }, cxLoggedOutAt: 0 });
    $('#se_deconnecter')?.addEventListener('click', () => storeSet({ cxLoggedOutAt: Date.now() }));
    return false;
  }

  // ---------- Préchargement au survol ----------
  function enablePrefetch() {
    const done = new Set();
    document.addEventListener(
      'pointerenter',
      (e) => {
        const a = e.target instanceof Element ? e.target.closest('.cx-top a[href], .cx-bento a[href]') : null;
        if (!a || a.target === '_blank') return;
        let url;
        try {
          url = new URL(a.href);
        } catch {
          return;
        }
        if (url.origin !== location.origin || /identification|logout|connexion/i.test(url.pathname)) return;
        if (url.pathname === location.pathname || done.has(url.href)) return;
        done.add(url.href);
        document.head.append(el('link', { rel: 'prefetch', href: url.href, as: 'document' }));
      },
      true,
    );
  }

  // ---------- Lancement ----------
  let started = false;
  function start() {
    if (started || !CX.settings.enabled) return;
    started = true;
    if (trackSession()) return;
    try {
      buildTopbar();
    } catch (err) {
      root.classList.add('cx-fallback');
      console.warn('[CESI+] barre du haut', err);
    }
    // Le titre de page est suivi d'un point jaune : on retire l'espace final du texte de l'ENT.
    const h1 = $('.page__titre h1');
    if (h1 && !h1.children.length) h1.textContent = clean(h1.textContent);
    for (const step of [buildHome, colorCalendar, cacheTools, enablePrefetch]) {
      try {
        step();
      } catch (err) {
        console.warn('[CESI+]', step.name, err);
      }
    }
    root.classList.add('cx-js');
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        palette.toggle();
      }
    });
  }

  start();
  CX.onChange((s) => {
    if (!started) start();
    else if (!s.enabled) location.reload();
  });
})();
