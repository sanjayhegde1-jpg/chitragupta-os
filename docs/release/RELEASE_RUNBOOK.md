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
# Hosting + Functions + Firestore rules + indexes
firebase deploy --only hosting,functions,firestore
```

## Rollback
- Re-deploy the previous release tag/commit.
- If needed, roll back Functions via the Firebase console (Functions -> Revisions).
