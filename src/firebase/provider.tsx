
'use client';

import React, { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { Functions } from 'firebase/functions';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
  functions: Functions | null;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({
  children,
  ...value
}: { children: React.ReactNode } & FirebaseContextValue) {
  // If firebaseApp is null, it means initialization failed.
  // We'll render the children without the provider to allow the app to run in a degraded state.
  if (!value.firebaseApp) {
    return <>{children}</>;
  }
  return (
    <FirebaseContext.Provider value={value}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

// Custom hooks to access Firebase services

export const useFirebaseApp = (): FirebaseApp | null => {
  const context = useContext(FirebaseContext);
  if (!context) return null;
  return context.firebaseApp;
};

export const useAuth = (): Auth | null => {
  const context = useContext(FirebaseContext);
  if (!context) return null;
  return context.auth;
};

export const useFirestore = (): Firestore | null => {
  const context = useContext(FirebaseContext);
  if (!context) return null;
  return context.firestore;
};

export const useStorage = (): FirebaseStorage | null => {
    const context = useContext(FirebaseContext);
    if (!context) return null;
    return context.storage;
};

export const useFunctions = (): Functions | null => {
    const context = useContext(FirebaseContext);
    if (!context) return null;
    return context.functions;
}

export const useUser = () => {
  const auth = useAuth();
  const [user, setUser] = React.useState<any>(null);
  const [isUserLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // If auth is not available (initialization failed), immediately set state to not loading and no user.
    if (!auth) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  return { user, isUserLoading };
};
