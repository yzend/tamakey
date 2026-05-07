# Tamakey

Vite + React + TypeScript virtual pet game with local-first persistence and PWA
packaging.

## Scripts

- `pnpm dev` starts the local dev server.
- `pnpm build` typechecks and builds for production.
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

## PWA

The app uses `vite-plugin-pwa` with Workbox and `registerType: 'autoUpdate'`.
That means service worker updates are applied automatically; there is no
blocking in-app update prompt. PWA acceptance coverage checks the web manifest,
icon assets, and that the game shell remains usable when service workers are
blocked.
