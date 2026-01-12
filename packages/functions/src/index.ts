import { socialManagerFlow } from './flows/social';
import { socialListenerFlow } from './flows/listener';
import { executiveFlow } from './flows/executive';
import { indiamartPollerFlow } from './flows/indiamart';
import { crmIngestFlow } from './flows/crm';
import { setGlobalOptions } from 'firebase-functions/v2';
// import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

setGlobalOptions({ region: 'asia-south1' });

// Ensure Firebase Admin is initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Export flows for Genkit
export { 
  socialManagerFlow, 
  socialListenerFlow,
  executiveFlow,
  indiamartPollerFlow,
  crmIngestFlow
};

import * as functions from 'firebase-functions';
export const helloChitragupta = functions.https.onRequest((request, response) => {
  response.send("Chitragupta OS | Genkit Brain Active");
});


// Verification Trigger: Force Backend Re-Deploy (IAM Permissions Check) - Attempt 2
