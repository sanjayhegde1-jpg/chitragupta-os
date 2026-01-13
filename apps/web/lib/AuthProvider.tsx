'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './firebase';

type MockUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
};

type AuthUser = User | MockUser;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

const mockUser: MockUser = {
  uid: "test-robot",
  email: "bot@chitragupta.os",
  displayName: "QA Bot",
  photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=qa"
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
  const [user, setUser] = useState<AuthUser | null>(() => (isTestMode ? mockUser : null));
  const [loading, setLoading] = useState(() => !isTestMode);

  useEffect(() => {
    // 1. MOCK MODE (Zero-Touch QA)
    if (isTestMode) {
      console.warn("AUTHENTICATION BYPASS ACTIVE: MOCK MODE");
      return;
    }

    // 2. STANDARD FIREBASE AUTH
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isTestMode]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
