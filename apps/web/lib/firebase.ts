import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // TODO: Replace with your actual config or let Firebase Hosting auto-configure
  apiKey: "AIzaSv...",
  authDomain: "beehive-os-dev.firebaseapp.com",
  projectId: "beehive-os-dev",
  storageBucket: "beehive-os-dev.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const functions = getFunctions(app, 'asia-south1');
const storage = getStorage(app);

export { app, db, functions, storage };
