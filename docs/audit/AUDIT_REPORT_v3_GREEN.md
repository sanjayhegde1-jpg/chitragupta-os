# Repository Audit Report v3 (GREEN)

## Status
- Overall: GREEN
- Rationale: Node 20 contract enforced, lockfiles normalized, Firebase web config environment-scoped, RBAC claims implemented, production bypass guarded, checks pass.

## Changes since v2
- Node 20 contract: `.nvmrc`, root `engines`, Volta pin, production preflight enforcement, Functions runtime set to `nodejs20`.
- Lockfile normalization: npm-only rule, `packageManager` pin, `check:lockfiles` script, Turbopack root set to repo, extra lockfile removed from cache.
- Web Firebase config: moved to `NEXT_PUBLIC_*` env variables with clear error message; `.env.example` added.
- RBAC: Firestore uses `request.auth.token.director == true`; script added to set custom claims; UI shows Access denied for non-directors.
- Production guardrails: DEV_BYPASS_AUTH restricted to emulators only; preflight fails if enabled in production.

## Verification (latest)
- `npm.cmd ci`: PASS (engine warnings expected on Node 24; clean on Node 20).
- `npm.cmd run check:lockfiles`: PASS.
- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd test`: PASS (3 Playwright tests).
- `npm.cmd run build`: PASS.

## Remaining risks
- None when following the runbook (Node 20 + env vars configured).

## Files added/updated
- `.nvmrc`
- `package.json` (engines/volta/packageManager/scripts)
- `scripts/preflight-node.cjs`, `scripts/check-lockfiles.cjs`, `scripts/set-director-claim.cjs`
- `apps/web/.env.example`, `apps/web/lib/firebase.ts`, `apps/web/next.config.ts`, `apps/web/app/settings/page.tsx`
- `firestore.rules`, `firebase.json`, `storage.rules`
- `packages/functions/src/lib/auth.ts`, `packages/functions/src/tools/*.ts`
- `docs/release/RELEASE_RUNBOOK.md`
