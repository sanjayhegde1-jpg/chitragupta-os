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

## 5. Deployment Fails with "Missing permissions to ActAs"
**Error**: `iam.serviceAccounts.ActAs` permission denied.
**Cause**: The CI/CD Service Account cannot impersonate the runtime identity.
**Fix**:
1. Go to [IAM Console](https://console.cloud.google.com/iam-admin/iam).
2. Locate the Service Account used in GitHub Secrets (usually `firebase-adminsdk`).
3. Add Role: **Service Account User** (`roles/iam.serviceAccountUser`).
4. Re-run the deployment.

## 6. Deployment Fails with "Permission denied to get service"
**Error**: `Permission denied to get service [firestore.googleapis.com]` (HTTP 403).
**Cause**: The CLI tries to check if APIs are enabled, but the Service Account misses `Service Usage` permissions.
**Fix**:
1. Go to [IAM Console](https://console.cloud.google.com/iam-admin/iam).
2. Edit the same Service Account (`firebase-adminsdk`).
3. Add Role: **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`).
4. Add Role: **Firebase Admin** (`roles/firebase.admin`). 
   *(Note: The "SDK Administrator" role is NOT enough. You need the full "Firebase Admin" or "Firebase Rules Admin" role to deploy rules).*

## 7. Deployment Fails with "checking firestore.rules... 403"
**Error**: `The caller does not have permission` accessing `firebaserules.googleapis.com`.
**Fix**: Apply Fix #6 above (specifically adding **Firebase Admin**).

## 8. Deployment Fails with "Cloud Billing API has not been used"
**Error**: `Cloud Billing API has not been used...` (HTTP 403).
**Cause**: The project API required to check billing status is disabled.
**Fix**: 
1. Click the link in the error log (or go to API Library).
2. **Enable** the `Cloud Billing API` for project `beehive-os-dev`.
3. Re-run deployment.

## 9. Deployment Fails with "npm error code EUSAGE" (Sharp Mismatch)
**Error**: `Invalid: lock file's sharp@... does not satisfy ...`
**Cause**: Windows generated `package-lock.json` misses Linux binaries required by Cloud Build.
**Fix**:
1. Add `"overrides": { "sharp": "0.33.5" }` to `package.json`.
2. Run `npm install`.
3. Force Linux binaries: `npm install --package-lock-only --os=linux --cpu=x64`.
4. Commit the universal `package-lock.json`.

## 10. Deployment Fails with "Failed to list functions"
**Cause**: Side effect of missing permissions (Cloud Billing/Service Usage) or wrong region config.
**Fix**: Ensure all APIs are enabled and IAM roles are applied.
