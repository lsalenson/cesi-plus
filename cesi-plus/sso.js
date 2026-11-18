// CESI+ — connexion simplifiée sur les pages « Votre identifiant » (ENT et portail CAS de Moodle).
// L'extension retient uniquement l'identifiant (adresse e-mail), jamais le mot de passe :
// celui-ci reste saisi sur la page Microsoft de CESI, où Chrome peut le remplir.
(() => {
  const CX = globalThis.CX;
  if (window.top !== window || (CX && !CX.settings.enabled)) return;

  const input = document.getElementById('login');
  const box = document.querySelector('.appconnexion');
  if (!input || !box) return;

  const isEnt = location.hostname === 'ent.cesi.fr';
  const form = isEnt ? input.closest('form') : null;
  const submit = isEnt ? form?.querySelector('[type="submit"]') : document.getElementById('submit');
  if (!submit) return;

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const AUTO_DELAY = 900;
  const LOGOUT_GRACE = 12 * 3600 * 1000;

  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const c of [].concat(children)) if (c) node.append(c);
    return node;
  };

  // Barre du haut minimale + titre.
  document.body.prepend(
    el('div', { class: 'cx-login-top' }, [
      el('span', { class: 'cx-login-brand' }, ['cesi', el('span', { class: 'cx-login-dot' })]),
      el('span', { class: 'cx-login-label', text: isEnt ? 'ENT CESI' : 'Moodle CESI' }),
    ]),
  );
  const intro = document.querySelector('.texteintroduction');
  if (intro) {
    intro.before(
      el('div', { class: 'cx-login-hello' }, [
        el('span', { class: 'cx-login-tag', text: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }),
        el('h1', { class: 'cx-login-title' }, ['Connexion', el('span', { class: 'cx-login-dot' })]),
      ]),
    );
  }

  const remember = () => {
    const value = input.value.trim();
    if (EMAIL.test(value)) chrome.storage.local.set({ cxLogin: value, cxLoggedOutAt: 0 });
  };
  if (form) form.addEventListener('submit', remember);
  submit.addEventListener('click', remember);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') remember();
  });

  chrome.storage.local.get(['cxLogin', 'cxLoggedOutAt', 'cxLastPage'], (st) => {
    const login = st.cxLogin;
    if (!login || !EMAIL.test(login)) {
      input.setAttribute('placeholder', 'prenom.nom@viacesi.fr');
      input.setAttribute('type', 'email');
      input.setAttribute('autocomplete', 'username');
      input.focus();
      return;
    }

    const go = () => {
      clearTimeout(timer);
      goBtn.disabled = true;
      goBtn.classList.add('is-loading');
      input.value = login;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      try {
        sessionStorage.setItem('cx-auto-ts', String(Date.now()));
        const last = st.cxLastPage;
        if (isEnt && last && Date.now() - last.ts < 30 * 60 * 1000) sessionStorage.setItem('cx-resume', last.url);
      } catch {}
      chrome.storage.local.set({ cxLoggedOutAt: 0 });
      if (form) form.requestSubmit ? form.requestSubmit(submit) : form.submit();
      else submit.click();
    };

    const showForm = () => {
      clearTimeout(timer);
      box.classList.remove('cx-has-quick');
      quick.remove();
      input.value = '';
      input.focus();
    };

    const initialsOf = (mail) => {
      const [a = '', b = ''] = mail.split('@')[0].split(/[._-]/);
      return ((a[0] || '') + (b[0] || '')).toUpperCase() || mail[0].toUpperCase();
    };

    const goBtn = el('button', { class: 'cx-quick__go', type: 'button' }, [el('span', { text: 'Continuer' }), el('span', { class: 'cx-quick__arrow', text: '→' })]);
    const other = el('button', { class: 'cx-quick__other', type: 'button', text: 'Utiliser un autre identifiant' });
    const quick = el('div', { class: 'cx-quick' }, [
      el('div', { class: 'cx-quick__who' }, [
        el('span', { class: 'cx-quick__avatar', text: initialsOf(login) }),
        el('span', {}, [el('small', { text: 'Se connecter en tant que' }), el('b', { text: login })]),
      ]),
      goBtn,
      other,
    ]);
    goBtn.addEventListener('click', go);
    other.addEventListener('click', showForm);
    box.classList.add('cx-has-quick');
    box.prepend(quick);
    goBtn.focus();

    // Connexion automatique, sauf juste après une déconnexion volontaire,
    // après une erreur, ou si une tentative automatique vient d'échouer dans cet onglet.
    let timer = 0;
    const loggedOut = st.cxLoggedOutAt && Date.now() - st.cxLoggedOutAt < LOGOUT_GRACE;
    const hasError = [...document.querySelectorAll('.error, .errors')].some((n) => n.offsetParent !== null && n.textContent.trim());
    let recent = false;
    try {
      recent = Date.now() - Number(sessionStorage.getItem('cx-auto-ts') || 0) < 20000;
    } catch {}
    if (!loggedOut && !hasError && !recent) {
      goBtn.classList.add('is-auto');
      goBtn.style.setProperty('--cx-auto', `${AUTO_DELAY}ms`);
      timer = setTimeout(go, AUTO_DELAY);
    }
  });
})();
