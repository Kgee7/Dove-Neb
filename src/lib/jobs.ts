import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Job } from './data';

// This function must be called on the server, e.g. in Server Components.
export async function getJob(id: string): Promise<Job | null> {
  // We need to initialize a new instance of firebase on the server.
  // Note that this is a different instance than the one on the client.
  const { firestore } = initializeFirebase();
  
  const jobRef = doc(firestore, 'jobListings', id);
  const jobSnap = await getDoc(jobRef);

  if (!jobSnap.exists()) {
    return null;
  }

  return jobSnap.data() as Job;
}
