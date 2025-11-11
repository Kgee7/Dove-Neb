
'use client';

import React from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/init';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = React.useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  // If initialization fails, firebaseServices.firebaseApp will be null.
  // In this case, we render the children without the provider to prevent a crash.
  if (!firebaseServices.firebaseApp) {
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
