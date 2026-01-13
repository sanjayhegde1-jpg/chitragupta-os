# Repository Audit Report v2

## Status
- Before: YELLOW (builds passed, lint/typecheck/test wiring missing, public Firestore reads, unauthenticated flows)
- After: YELLOW (tooling and auth hardened; remaining risks documented)

## What changed
- Tooling normalized at repo root (`lint`, `typecheck`, `test`, `preflight`).
- ESLint errors fixed in `apps/web` (no explicit `any`, unused vars, unescaped entities, and effect state update).
- Firestore rules locked down to authenticated access with a director allowlist for `system_config`.
- Added Storage rules (auth required) and wired to `firebase.json`.
- Genkit flows now require verified Firebase ID tokens (DEV bypass available via `DEV_BYPASS_AUTH`).
- Replaced `dangerouslySetInnerHTML` with a client-side ServiceWorker cleanup component.

## Checks (latest)
- `npm.cmd ci`: previously completed with Node engine warnings for functions (Node 20 required).
- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS (warns on Node version if not 20.x).
- `npm.cmd test`: PASS (3 Playwright tests).
- `npm.cmd run build`: PASS (Next.js warning about multiple lockfiles persists).

## Remaining risks / gaps
- Node engine mismatch: local/CI using Node 24 will warn; functions target Node 20.
- Hardcoded Firebase client config in `apps/web/lib/firebase.ts` (public config but not environment-scoped).
- Next.js workspace root warning due to multiple lockfiles (non-blocking but should be resolved).
- Director allowlist uses a hardcoded email in `firestore.rules` (replace with custom claims / RBAC).

## Production safety summary
- Firestore: authenticated-only access with restricted `system_config` writes/reads.
- Functions/Genkit: verified Firebase ID token required; DEV bypass explicitly gated.
- Storage: authenticated-only access.

## Files updated
- `package.json`
- `scripts/preflight-node.cjs`
- `apps/web/*` lint fixes + `ServiceWorkerCleanup`
- `packages/functions/src/lib/auth.ts`
- `packages/functions/src/flows/*`
- `packages/functions/src/index.ts`
- `firestore.rules`, `storage.rules`, `firebase.json`
- `docs/release/RELEASE_RUNBOOK.md`
