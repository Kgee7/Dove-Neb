'use client';

// Core Provider and Initialization
export {
  FirebaseProvider,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useStorage,
  useFunctions,
  useUser,
} from './provider';
export type { FirebaseContextValue } from './provider';
export { initializeFirebase } from './init';
export { firebaseConfig } from './config';
export { FirebaseClientProvider } from './client-provider';

// Custom Hooks
export { useDoc } from './firestore/use-doc';
export type { UseDocResult } from './firestore/use-doc';
export { useCollection } from './firestore/use-collection';
export type { UseCollectionResult } from './firestore/use-collection';

// Error Handling
export { FirestorePermissionError } from './errors';
export { errorEmitter } from './error-emitter';
export type { AppEvents } from './error-emitter';

// Non-blocking operations
export {
  initiateAnonymousSignIn,
  initiateEmailSignUp,
  initiateEmailSignIn,
} from './non-blocking-login';
export {
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from './non-blocking-updates';

// Firebase SDK re-exports for convenience
// AUTH
export {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';

// FIRESTORE
export {
  doc,
  collection,
  query,
  where,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  type DocumentReference,
  type CollectionReference,
  type Query as FirestoreQuery,
} from 'firebase/firestore';

// STORAGE
export {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
  type FirebaseStorage,
} from 'firebase/storage';

// FUNCTIONS
export {
  getFunctions,
  httpsCallable,
  type Functions,
} from 'firebase/functions';
