// CESI+ — sur la page de connexion de Moodle, on passe directement par la connexion ENT (CAS),
// au lieu d'afficher le formulaire identifiant / mot de passe local que les étudiants n'utilisent pas.
// Pour afficher le formulaire local malgré tout : https://moodle.cesi.fr/login/index.php?cxmanual=1
(() => {
  const url = new URL(location.href);
  const params = url.searchParams;
  try {
    if (params.has('cxmanual')) sessionStorage.setItem('cx-moodle-manual', '1');
    if (params.has('authCAS') || params.has('errorcode') || params.has('cxmanual') || sessionStorage.getItem('cx-moodle-manual')) return;
    // Garde-fou contre les boucles de redirection.
    if (Date.now() - Number(sessionStorage.getItem('cx-moodle-auto') || 0) < 60000) return;
  } catch {
    return;
  }
  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
    if (!enabled) return;
    try {
      sessionStorage.setItem('cx-moodle-auto', String(Date.now()));
    } catch {}
    location.replace(`${url.origin}/login/index.php?authCAS=CAS`);
  });
})();
