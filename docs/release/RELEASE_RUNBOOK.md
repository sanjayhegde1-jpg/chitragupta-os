# Release Runbook

## Prerequisites
- Node.js 20.x (recommended). If you are on another version, run `npm run preflight` and read the warning.
- Firebase CLI authenticated (`firebase login`) and correct project configured in `.firebaserc`.

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
### Functions auth
- Functions now require a verified Firebase ID token by default.
- DEV-only bypass: set `DEV_BYPASS_AUTH=true` in non-production environments.
- In production, keep `DEV_BYPASS_AUTH` unset or `false`.

### Firestore rules allowlist
- `firestore.rules` includes a minimal director allowlist based on email.
- Update `director@chitragupta.os` to the correct admin email or replace with custom claims.

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
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Firebase deploy
```bash
# Hosting + Functions + Firestore rules + Storage rules + indexes
firebase deploy --only hosting,functions,firestore,storage
```

## Rollback
- Re-deploy the previous release tag/commit.
- If needed, roll back Functions via the Firebase console (Functions -> Revisions).
