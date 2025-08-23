# IDKDO — Listes de cadeaux à partager

IDKDO est une application pour créer ta liste de cadeaux, la partager avec tes proches et découvrir leurs idées. Chacun peut proposer des idées, s’organiser en groupes (famille/amis) et éviter les doublons grâce aux « je m’en occupe » privés.

## Fonctionnalités clés
- Ma liste de souhaits (création, édition)
- Groupes pour partager entre proches
- Suggestions sur la liste de quelqu’un (avec validation par le propriétaire)
- « Je m’en occupe » privé (visible par les autres, pas par le propriétaire)
- Notifications push (nouveau membre, nouvelles suggestions, suggestion acceptée, prise en charge d’une idée)
- Installation PWA (ajout sur l’écran d’accueil, lancement plein écran)

## Comment ça marche
1. Connecte-toi puis crée ta liste.
2. Crée/rejoins un groupe pour partager vos listes.
3. Propose des idées, accepte celles qu’on te propose, et marque celles dont tu t’occupes.

## PWA et notifications
- L’app propose l’installation via un overlay discret (masqué 7 jours après refus, invisible si déjà installée).
- Les notifications push sont opt‑in (activation dans « Mon profil »). Les abonnements sont stockés par appareil côté serveur.

## Stack
- Next.js (App Router) • React • TypeScript
- Better Auth + Prisma (PostgreSQL)
- Web Push (VAPID) + Service Worker
- Tailwind CSS

## Configuration rapide
Variables d’environnement principales :
- `DATABASE_URL` — connexion PostgreSQL
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — clés VAPID pour les notifications push
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — OAuth Google (connexion)

## Démarrer
```bash
bun install
bun run dev
```
Production :
```bash
bun run build
bun start
```

## Sécurité & confidentialité
- Les « je m’en occupe » sont invisibles pour le propriétaire de la liste.
- Les consentements PWA/notifications sont gérés côté client. Les abonnements push peuvent être révoqués à tout moment.

—
Des idées d’amélioration ? Ouvre une issue ou une PR.
