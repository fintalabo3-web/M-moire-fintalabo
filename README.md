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
Les migrations sont versionnées dans `supabase/migrations/` et appliquées au projet Supabase associé.

- `20261124000100_platform_upgrade.sql` : boîte à idées, support, statistiques, annonces multimédias et RPC protégées.
- `20261124000200_query_indexes_and_visit_policy.sql` : index et politique de suivi des visites.
- `20261124000300_remove_duplicate_idea_like_index.sql` : suppression d'un index strictement redondant.
- `20261124000400_moderator_permissions_and_storage_hardening.sql` : alignement des permissions des modérateurs et restriction des écritures dans l'ancien bucket d'annonces aux administrateurs.
- `20261124000500_authenticated_staff_policy_scope.sql` : limitation des politiques d'administration aux sessions authentifiées.
- `20261124000600_fix_moderator_rls_recursion.sql` : fonction sécurisée de lecture des permissions du modérateur, sans récursion RLS.
- `20261124000700_unify_admin_checks_and_limit_staff_status.sql` : vérification administrateur unifiée et prévention de la divulgation du statut d'autres comptes.
- `20261124000800_fail_closed_staff_suspension.sql` : contrôle de suspension des comptes avec refus explicite par défaut.

Les migrations 004 et 005 ne suppriment aucune donnée. Les droits sensibles sont contrôlés côté PostgreSQL/RLS et non uniquement par l'interface.

## Coût de fonctionnement

Le projet est conçu pour démarrer avec un budget de **0 FCFA** : GitHub, Netlify et Supabase sont utilisés sur leurs offres gratuites. Les quotas gratuits et leurs limites doivent être surveillés (stockage, bande passante, base de données et disponibilité). Aucune clé secrète ou clé `service_role` ne doit être placée dans le frontend ou le dépôt.
