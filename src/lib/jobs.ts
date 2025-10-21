import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Job } from './data';

function initializeServerFirebase() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

// This function must be called on the server, e.g. in Server Components.
export async function getJob(id: string): Promise<Job | null> {
  // We need to initialize a new instance of firebase on the server.
  // Note that this is a different instance than the one on the client.
  const firebaseApp = initializeServerFirebase();
  const firestore = getFirestore(firebaseApp);
  
  const jobRef = doc(firestore, 'jobListings', id);
  const jobSnap = await getDoc(jobRef);

  if (!jobSnap.exists()) {
    return null;
  }

  return jobSnap.data() as Job;
}
