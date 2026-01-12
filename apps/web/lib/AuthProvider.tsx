'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './firebase';

interface AuthContextType {
  user: User | null; // Use Firebase User type or a compatible mock
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. MOCK MODE (Zero-Touch QA)
    if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
      console.warn("⚠️ AUTHENTICATION BYPASS ACTIVE: MOCK MODE");
      setUser({
        uid: "test-robot",
        email: "bot@chitragupta.os",
        displayName: "QA Bot",
        photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=qa"
      });
      setLoading(false);
      return;
    }

    // 2. STANDARD FIREBASE AUTH
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
