// CESI+ — démarrage (document_start)
// Applique le thème avant le premier affichage pour éviter tout flash de l'ancienne interface.
(() => {
  const root = document.documentElement;
  const LS_KEY = 'cx-settings';
  const DEFAULTS = { enabled: true, theme: 'auto', accent: 'orange' };
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const listeners = new Set();

  let settings = { ...DEFAULTS };
  try {
    settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') };
  } catch {}

  // Fondu enchaîné natif entre les pages (View Transitions inter-documents).
  const vt = document.createElement('style');
  vt.id = 'cx-view-transition';
  vt.textContent = '@view-transition { navigation: auto; }';

  function apply() {
    const dark = settings.theme === 'dark' || (settings.theme === 'auto' && mq.matches);
    root.classList.toggle('cx-on', !!settings.enabled);
    root.dataset.cxTheme = dark ? 'dark' : 'light';
    root.dataset.cxAccent = settings.accent;
    if (settings.enabled) {
      if (!vt.isConnected) root.appendChild(vt);
    } else {
      vt.remove();
    }
    listeners.forEach((fn) => fn(settings));
  }

  function remember() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(settings));
    } catch {}
  }

  apply();

  const store = globalThis.chrome?.storage;
  if (store?.sync) {
    store.sync.get(DEFAULTS, (saved) => {
      settings = { ...DEFAULTS, ...saved };
      remember();
      apply();
    });
    store.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      for (const key of Object.keys(changes)) {
        if (key in DEFAULTS) settings[key] = changes[key].newValue ?? DEFAULTS[key];
      }
      remember();
      apply();
    });
  }
  mq.addEventListener('change', apply);

  // Partagé avec content.js (même monde isolé).
  globalThis.CX = {
    get settings() {
      return { ...settings };
    },
    get isDark() {
      return root.dataset.cxTheme === 'dark';
    },
    set(patch) {
      settings = { ...settings, ...patch };
      remember();
      apply();
      store?.sync?.set(patch);
    },
    onChange(fn) {
      listeners.add(fn);
    },
  };
})();
