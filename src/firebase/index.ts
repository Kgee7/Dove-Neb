
'use client';

// Core Provider and Initialization
export * from './provider';
export * from './init';
export * from './config';
export * from './client-provider';

// Custom Hooks
export * from './firestore/use-doc';
export * from './firestore/use-collection';

// Error Handling
export * from './errors';
export * from './error-emitter';

// Non-blocking operations
export * from './non-blocking-login';
export * from './non-blocking-updates';

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
