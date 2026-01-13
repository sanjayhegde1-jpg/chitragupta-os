# Release Runbook

## Prerequisites
- Node.js 20.x (recommended). If you are on another version, run `npm run preflight` and read the warning.
- Firebase CLI authenticated (`firebase login`) and correct project configured in `.firebaserc`.

## Windows Node.js 20 install
Option 1 (nvm-windows):
1) Install nvm-windows: https://github.com/coreybutler/nvm-windows/releases
2) Open a new terminal and run:
   - `nvm install 20.12.2`
   - `nvm use 20.12.2`
   - `node -v` (verify it shows v20.x)

Option 2 (direct installer):
1) Download Node.js 20.x LTS from https://nodejs.org/
2) Install and verify with `node -v`

## Windows (PowerShell) note
PowerShell may block `npm` due to execution policy. Use `npm.cmd` instead:
- `npm.cmd ci`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`

Optional (if you prefer `npm` directly):
- Run PowerShell as Administrator and set: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## Environment setup
### Web app (Next.js)
- Create `apps/web/.env.local` from `apps/web/.env.example`.
- Set all `NEXT_PUBLIC_FIREBASE_*` values for the target Firebase project.

### Functions auth
- Functions now require a verified Firebase ID token by default.
- DEV-only bypass: set `DEV_BYPASS_AUTH=true` in non-production environments.
- In production, keep `DEV_BYPASS_AUTH` unset or `false`.

### Firestore rules allowlist
- `firestore.rules` requires `request.auth.token.director == true` for `system_config`.

### Director claim setup
Prerequisites:
- Service account JSON with Admin SDK privileges.
- `GOOGLE_APPLICATION_CREDENTIALS` set to the JSON path.

Set or remove director claim:
```bash
node scripts/set-director-claim.cjs --email admin@example.com --value true
node scripts/set-director-claim.cjs --email admin@example.com --value false
```

### Secrets
- Functions rely on Firebase secrets or environment variables.
- Required secrets (examples):
  - `WABA_TOKEN`
  - `INDIAMART_API_KEY`
  - `INDIAMART_MOBILE` (optional fallback used if not set)

Set secrets:
```bash
firebase functions:secrets:set WABA_TOKEN
firebase functions:secrets:set INDIAMART_API_KEY
firebase functions:secrets:set INDIAMART_MOBILE
```

## Local checks
```bash
npm.cmd ci
npm.cmd run check:lockfiles
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Package manager rule
- Use npm only.
- Only the root `package-lock.json` is allowed.
- Run `npm.cmd run check:lockfiles` in CI to enforce.

## Firebase deploy
```bash
# Hosting + Functions + Firestore rules + Storage rules + indexes
firebase deploy --only hosting,functions,firestore,storage
```

## Rollback
- Re-deploy the previous release tag/commit.
- If needed, roll back Functions via the Firebase console (Functions -> Revisions).
