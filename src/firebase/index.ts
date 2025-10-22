import { FirebaseError } from 'firebase/app';
import { doc, setDoc, onSnapshot, DocumentData, FirestoreError, collection, getDocs, getDoc, query, where, deleteDoc } from 'firebase/firestore';
import { useMemo } from 'react';

export const setDocument = async (ref: any, data: any, options: any) => {
    await setDoc(ref, data, options);
};

export const getDocument = async (ref: any) => {
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
        const docData = docSnap.data();
        return Object.assign({ id: docSnap.id }, docData);
    }
    return null;
};

export const deleteDocument = async (ref: any) => {
    await deleteDoc(ref);
};

export * from './provider';
export * from './config';
export * from './errors';
export * from 'firebase/auth';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from 'firebase/storage';
export * from './non-blocking-login';
export { useMemo };
