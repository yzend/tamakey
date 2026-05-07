# Tamakey

Vite + React + TypeScript virtual pet game with local-first persistence and PWA
packaging.

## Scripts

- `pnpm dev` starts the local dev server.
- `pnpm build` typechecks and builds for production.
- `pnpm pages:dev` builds the app and runs Cloudflare Pages locally with
  Functions.
- `pnpm pages:deploy` builds and deploys `dist` to the `tamakey` Cloudflare
  Pages project.
- `pnpm lint` runs ESLint.
- `pnpm typecheck` runs TypeScript without emitting files.
- `pnpm test` runs Vitest unit tests.
- `pnpm e2e` runs Playwright E2E tests.
- `pnpm verify` runs typecheck, lint, unit tests, production build, and E2E.

## Persistence

Current saves use `schemaVersion: 3` and `tamakey.save.v3`. The loader still
accepts `tamakey.save.v2` and `tamakey.save.v1`, migrates them to v3, and writes
future saves back through the v3 key. Invalid JSON or unsupported schemas are
rejected and backed up under `tamakey.save.backup.v3`.

## Cloudflare Pages

V1.1 is ready for Cloudflare Pages deployment:

- React/Vite builds static assets into `dist`.
- `public/_routes.json` sends only `/api/*` through Pages Functions.
- `functions/api/[[route]].ts` exposes a Hono API shell.
- `/api/health` returns deployment and local-save status.
- `/api/v1/meta` documents disabled V1.1 cloud features for future clients.

The game still uses IndexedDB/localStorage for saves. The Hono structure is
reserved for V2, where Pages Functions can add D1, KV, login, and cloud-save
routes without changing the frontend hosting model.

## PWA

The app uses `vite-plugin-pwa` with Workbox and `registerType: 'autoUpdate'`.
That means service worker updates are applied automatically; there is no
blocking in-app update prompt. PWA acceptance coverage checks the web manifest,
icon assets, and that the game shell remains usable when service workers are
blocked.
