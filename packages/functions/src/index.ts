import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { verifyRequestAuth } from './lib/auth';

setGlobalOptions({ region: 'asia-south1' });

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Genkit Flows (Refactored to Cloud Functions)
export { socialManager } from './flows/social';
export { socialListener } from './flows/listener';
export { executive } from './flows/executive';
export { indiamartPoller } from './flows/indiamart';
export { crmIngest } from './flows/crm';
export { createWhatsappDraft, approveWhatsappDraft } from './flows/whatsapp';
export { getDashboardMetrics } from './flows/metrics';

// Verification Endpoint
export const helloChitragupta = onRequest(async (request, response) => {
  const auth = await verifyRequestAuth(request);
  if (!auth) {
    response.status(401).send('Unauthorized');
    return;
  }

  response.send("Chitragupta OS | Genkit Brain Active");
});
