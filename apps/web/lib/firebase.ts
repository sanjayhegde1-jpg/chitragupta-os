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

export { app, db };
