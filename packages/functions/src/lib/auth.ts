import type { Request, RequestHandler } from 'express';
import * as admin from 'firebase-admin';
import type { FunctionFlowAuth } from '@genkit-ai/firebase/functions';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const isEmulator =
  process.env.FUNCTIONS_EMULATOR === 'true' ||
  !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  !!process.env.FIRESTORE_EMULATOR_HOST;

const isBypassEnabled =
  process.env.DEV_BYPASS_AUTH === 'true' &&
  process.env.NODE_ENV !== 'production' &&
  isEmulator;

type AuthedRequest = Request & { auth?: unknown };

const getBearerToken = (req: Request): string | undefined => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
};

const withAuthContext: RequestHandler = async (req, res, next) => {
  const authedReq = req as AuthedRequest;
  if (isBypassEnabled) {
    authedReq.auth = { uid: 'dev-bypass', bypass: true };
    return next();
  }

  const token = getBearerToken(req);
  if (!token) {
    res.status(401).send('Missing Authorization header.');
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    authedReq.auth = decoded;
    next();
  } catch (error) {
    console.error('[auth] Invalid token', error);
    res.status(401).send('Invalid or expired token.');
  }
};

export const firebaseAuth: FunctionFlowAuth<any> = {
  provider: withAuthContext,
  policy: (auth) => {
    if (!auth) {
      throw new Error('Unauthorized');
    }
  },
};

export const verifyRequestAuth = async (req: Request) => {
  if (isBypassEnabled) {
    return { uid: 'dev-bypass', bypass: true };
  }

  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('[auth] Invalid token', error);
    return null;
  }
};
