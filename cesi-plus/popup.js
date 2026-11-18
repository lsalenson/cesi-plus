// CESI+ — réglages (popup). Les changements s'appliquent en direct sur les onglets de l'ENT.
const DEFAULTS = { enabled: true, theme: 'auto', accent: 'orange' };

const enabled = document.getElementById('enabled');
const groups = { theme: document.getElementById('theme') };

function paint(settings) {
  enabled.checked = settings.enabled;
  for (const [key, group] of Object.entries(groups)) {
    for (const button of group.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.value === settings[key]));
    }
  }
}

chrome.storage.sync.get(DEFAULTS, (settings) => {
  paint(settings);

  enabled.addEventListener('change', () => {
    settings.enabled = enabled.checked;
    chrome.storage.sync.set({ enabled: settings.enabled });
  });

  for (const [key, group] of Object.entries(groups)) {
    group.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-value]');
      if (!button) return;
      settings[key] = button.dataset.value;
      chrome.storage.sync.set({ [key]: settings[key] });
      paint(settings);
    });
  }
});

// Identifiant mémorisé pour la connexion en un clic (jamais de mot de passe).
const loginBlock = document.getElementById('login-block');
chrome.storage.local.get('cxLogin', ({ cxLogin }) => {
  if (!cxLogin) return;
  document.getElementById('login-value').textContent = cxLogin;
  loginBlock.hidden = false;
});
document.getElementById('login-forget').addEventListener('click', () => {
  chrome.storage.local.remove('cxLogin');
  loginBlock.hidden = true;
});
