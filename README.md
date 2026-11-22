# FasoService

Plateforme de mise en relation entre clients et prestataires de services au Burkina Faso.

**Site :** https://fasoservice.netlify.app

## Stack
- Frontend : HTML, CSS et JavaScript vanilla (PWA)
- Backend : Supabase (Auth, Postgres, Storage)
- Hébergement : Netlify

## Structure
| Fichier | Rôle |
|---|---|
| `index.html` | Structure de l'application |
| `style.css` | Identité graphique responsive, thèmes clair et sombre |
| `app.js` | Logique métier, comptes, demandes, messagerie et administration |
| `enhancements.js` | Accueil dynamique, carrousel, thème et installation PWA |
| `sw.js` | Service Worker et cache versionné |
| `manifest.json` | Configuration d'installation PWA |

## Fonctionnalités
- Recherche et profils prestataires
- Sections d'accueil : prestataires par ville, profils populaires et nouveaux profils
- Demandes de service, SOS, messages et avis
- Comptes clients et prestataires, parrainage
- Administration, modération, annonces et abonnements
- Thème clair/sombre mémorisé
- Carrousel promotionnel, illustrations SVG et animations discrètes
- PWA installable avec stratégie de cache hors ligne

## Données et confidentialité
Les sections de découverte affichent les profils réellement présents dans Supabase. La ville est choisie par l'utilisateur ou reprise du profil connecté ; aucune géolocalisation n'est déclenchée sans action explicite. Les illustrations sont des SVG intégrés au code et ne prétendent pas être des photographies.

Les transactions client ↔ prestataire se font hors application. Les abonnements prestataires se finalisent par appel ou WhatsApp.

## Déploiement
Déployer les fichiers du dépôt sur Netlify. Le projet utilise la configuration Supabase déjà intégrée au code client avec une clé publishable. Ne jamais ajouter de clé secrète dans le dépôt.
