
'use client';

import { FirebaseError } from 'firebase/app';
import { doc, setDoc, onSnapshot, DocumentData, FirestoreError, collection, getDocs, getDoc, query, where, deleteDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useFirestore } from '../provider';

// TODO: Look into using react-query for this
export function useCollection<T>(path: string, options?: {
  where?: [string, '==', any];
}) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const q = useMemo(() => {
    if (!firestore) return null;
    if (options?.where) {
      return query(collection(firestore, path), where(...options.where));
    } else {
      return query(collection(firestore, path));
    }
  }, [firestore, path, options?.where]);

  useEffect(() => {
    if (!q) return;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: T[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(data);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setError(err);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [q]);

  return { data, isLoading, error };
}
