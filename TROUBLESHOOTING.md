# Troubleshooting Guide 🔧

## 1. Region Mismatch Errors
**Issue**: Cloud Functions failing with "Region mismatch" or 404.
**Fix**: Ensure all functions and the client SDK are strictly locked to `asia-south1`.
- Check `packages/functions/src/index.ts`: `setGlobalOptions({ region: 'asia-south1' });`
- Check `apps/web/lib/firebase.ts`: `getFunctions(app, 'asia-south1');`

## 2. Secret Management
**Issue**: API Keys (WABA_TOKEN, INDIAMART_KEY) missing or expired.
**Fix**: Rotate secrets using the Firebase CLI.
```bash
# Set new secret value
firebase functions:secrets:set WABA_TOKEN --project beehive-os-dev

# Redeploy functions to pick up the change
firebase deploy --only functions
```

## 3. Local Testing (Auth Bypass)
**Issue**: Cannot log in via Google Auth on localhost without internet or valid creds.
**Fix**: Enable "Mock Mode" to use the QA Bot identity.
```bash
# Run web app in Test Mode
NEXT_PUBLIC_TEST_MODE=true npm run dev --prefix apps/web
```
*Note: This bypass is disabled in production.*

## 4. Git Conflicts in Monorepo
**Issue**: `git push` rejected due to remote changes.
**Fix**: Use the autonomous save protocol.
```bash
# (If implemented as script)
./scripts/save.sh
```
Or manually:
```bash
git pull --rebase origin main
git push origin main
```
