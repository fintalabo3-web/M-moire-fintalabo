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
| `index.html` | Structure des pages et navigation |
| `style.css` | Identité graphique responsive, thèmes clair et sombre |
| `app.js` | Comptes, prestataires, demandes, messagerie et administration |
| `community.js` | Boîte à idées, commentaires, likes, FAQ, contact, favoris, partage et statistiques |
| `enhancements.js` | Accueil dynamique, carrousel, thème et installation PWA |
| `sw.js` | Service Worker et cache versionné |
| `supabase/migrations/` | Historique des migrations SQL |
| `manifest.json` | Configuration d'installation PWA |

## Fonctionnalités
- Recherche, profils et catégories de prestataires
- Prestataires par ville, populaires et nouveaux profils
- Demandes de service, SOS, messages et avis
- Comptes clients et prestataires
- Favoris
- Boîte à idées avec commentaires et likes
- FAQ et formulaire de contact de l'équipe
- Partage natif de l'application
- Suivi des visites et statistiques réservées au propriétaire
- Administration, modération, annonces multimédias et abonnements
- Thème clair/sombre, carrousel, illustrations SVG
- PWA installable avec cache hors ligne versionné

## Données et confidentialité
Les profils affichés proviennent de Supabase. La géolocalisation n'est pas déclenchée sans action explicite. Le suivi des visites utilise un identifiant aléatoire local et ne collecte pas l'adresse IP. Les statistiques détaillées sont réservées au propriétaire. Les messages de contact ne sont accessibles qu'à l'administration.

Les illustrations sont des SVG intégrés au code et ne prétendent pas être des photographies.

## Déploiement
Déployer les fichiers du dépôt sur Netlify. Le projet utilise la clé publishable Supabase côté navigateur. Ne jamais ajouter une clé secrète ou service_role dans le dépôt.

## Migrations Supabase
Les migrations sont versionnées dans `supabase/migrations/`. La migration `20261124000100_platform_upgrade.sql` restaure la boîte à idées, ajoute la boîte de réception de support, les statistiques visiteurs et le stockage des annonces multimédias. Elle protège aussi les RPC de gestion des photos et services et conserve les données existantes.
