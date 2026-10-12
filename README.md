# FasoService

Plateforme de mise en relation entre clients et prestataires de services au Burkina Faso.

**Site :** https://fasoservice.netlify.app

## Stack

- Frontend : HTML / CSS / JavaScript (PWA)
- Backend : Supabase (Auth, Postgres, Storage)
- Hébergement : Netlify

## Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `index.html` | Structure de l'application |
| `app.js` | Logique métier |
| `style.css` | Styles |
| `sw.js` | Service Worker (PWA) |
| `manifest.json` | Manifeste d'installation |

## Fonctionnalités

- Recherche de prestataires, profils, galerie (photos / vidéos)
- Demandes de service, messages, avis
- Compte client / prestataire, parrainage
- Contact équipe (WhatsApp / appel)
- Admin / modération, annonces, boîte à idées
- PWA installable (Ajouter à l'écran d'accueil)

## Pas de paiement in-app

Les transactions client ↔ prestataire se font hors application.  
Les abonnements prestataires se finalisent par appel ou WhatsApp.

## Développement

Déployer le dossier de production (fichiers listés ci-dessus) sur Netlify.  
Configurer Supabase (Auth URL, Storage `provider-photos`, policies RLS).
