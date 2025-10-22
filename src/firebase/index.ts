
'use client';

export * from './provider';
export * from './config';
export * from './errors';
export * from 'firebase/auth';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from 'firebase/storage';
export * from './non-blocking-login';
export * from './non-blocking-updates';
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
} from 'firebase/firestore';
export { useMemo } from 'react';

// A hook to memoize Firebase queries and references.
export const useMemoFirebase = useMemo;
