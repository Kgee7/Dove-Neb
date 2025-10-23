'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Array of documents with IDs, or null.
  isLoading: boolean;        // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection in real-time.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedQuery or BAD THINGS WILL HAPPEN.
 * Use useMemo to memoize it per React guidance. Also, ensure that its dependencies are stable.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {Query<DocumentData> | null | undefined} memoizedQuery -
 * The Firestore Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
  memoizedQuery: Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  type StateDataType = WithId<T>[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // This is the key change: a robust guard clause at the top.
    if (!memoizedQuery) {
      setData(null);
      setIsLoading(false); // Not loading because there's nothing to fetch
      setError(null);
      return; // Stop execution if the query is not ready
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(docs);
        setIsLoading(false);
        setError(null); // Clear previous errors on new data
      },
      (error: FirestoreError) => {
        // This check prevents an error when the path is undefined
        if (!memoizedQuery.path) {
          console.error("useCollection error: Query path is undefined.", error);
          setError(new Error("Firestore query path is undefined."));
          setData(null);
          setIsLoading(false);
          return;
        }

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: memoizedQuery.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]); // Re-run if the memoizedQuery changes

  return { data, isLoading, error };
}
