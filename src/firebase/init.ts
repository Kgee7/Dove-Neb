
import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { firebaseConfig } from './config';

interface FirebaseServices {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
  functions: Functions | null;
}

export function initializeFirebase(): FirebaseServices {
  // Prevent Firebase initialization on the server.
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null, storage: null, functions: null };
  }

  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);
    const functions = getFunctions(app);
    return { firebaseApp: app, auth, firestore, storage, functions };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // Return null services to prevent app crash if config is invalid.
    return { firebaseApp: null, auth: null, firestore: null, storage: null, functions: null };
  }
}
