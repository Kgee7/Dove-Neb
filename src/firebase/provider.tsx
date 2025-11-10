
'use client';

import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import React, { createContext, useContext } from 'react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({
  children,
  ...value
}: { children: React.ReactNode } & FirebaseContextValue) {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

// Custom hooks to access Firebase services

export const useFirebaseApp = (): FirebaseApp => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.firebaseApp;
};

export const useAuth = (): Auth => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context.auth;
};

export const useFirestore = (): Firestore => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
};

export const useStorage = (): FirebaseStorage => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useStorage must be used within a FirebaseProvider');
    }
    return context.storage;
};

export const useUser = () => {
  const auth = useAuth();
  const [user, setUser] = React.useState<any>(null);
  const [isUserLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  return { user, isUserLoading };
};
