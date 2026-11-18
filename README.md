# CESI+

Extension Chrome qui refait l'interface de l'ENT CESI (`ent.cesi.fr`), dans le style « Wiz. » : jaune, anthracite et crème, police arrondie Fredoka, grandes tuiles.

## Ce qu'elle fait

- **Une seule barre de navigation** : Accueil, Emploi du temps, Cours, Notes, Plus, puis recherche, thème, notifications et compte.
- **Accueil en tuiles** : prochain cours, cours de la journée, rendus Moodle à venir, cours Moodle récents, accès directs.
- **Moodle sur l'accueil** : les cours et les rendus sont récupérés avec ta session Moodle, sans rien configurer.
- **Connexion simplifiée** : l'extension retient ton identifiant (jamais ton mot de passe) et valide seule l'écran « Votre identifiant ». La page de connexion Moodle passe directement par l'ENT.
- **Recherche rapide** avec `⌘K` / `Ctrl K` : pages, cours Moodle, outils.
- **Mode sombre**, emploi du temps coloré par matière, réglages dans la popup de l'extension.

## Installation

1. Télécharge le dépôt (`Code` → `Download ZIP`, puis dézippe), ou clone-le.
2. Ouvre `chrome://extensions` dans Chrome.
3. Active le **Mode développeur** (en haut à droite).
4. Clique sur **Charger l'extension non empaquetée** et choisis le dossier `cesi-plus`.
5. Ouvre ou recharge [ent.cesi.fr](https://ent.cesi.fr).

Après une mise à jour du code, clique sur la flèche circulaire de la carte CESI+ dans `chrome://extensions`, puis recharge l'ENT.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `cesi-plus/manifest.json` | Déclaration de l'extension (Manifest V3) |
| `cesi-plus/theme.css` | Thème de l'ENT |
| `cesi-plus/boot.js` | Applique le thème dès le chargement (clair / sombre) |
| `cesi-plus/content.js` | Barre de navigation, accueil, recherche ⌘K |
| `cesi-plus/background.js` | Récupère les cours et rendus Moodle |
| `cesi-plus/sso.js`, `cesi-plus/login.css` | Connexion simplifiée |
| `cesi-plus/moodle-login.js` | Redirige la connexion Moodle vers l'ENT |
| `cesi-plus/popup.html`, `cesi-plus/popup.js` | Réglages |

Police : [Fredoka](https://fonts.google.com/specimen/Fredoka), licence SIL Open Font License.
