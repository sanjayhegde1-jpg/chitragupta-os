import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized (it might be initialized in index.ts, but safe to check)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export const getIntegrationConfig = async (key: string): Promise<string | undefined> => {
  // 1. Priority: Environment Variable
  if (process.env[key]) {
    console.log(`[Config] Loaded ${key} from environment.`);
    return process.env[key];
  }

  // 2. Fallback: Firestore System Config
  try {
    const doc = await db.collection('system_config').doc('integrations').get();
    if (doc.exists) {
      const data = doc.data();
      if (data && data[key]) {
        console.log(`[Config] Loaded ${key} from Firestore.`);
        return data[key];
      }
    }
  } catch (error) {
    console.error(`[Config] Failed to fetch ${key} from Firestore:`, error);
  }

  console.warn(`[Config] Missing configuration for ${key}.`);
  return undefined;
};
