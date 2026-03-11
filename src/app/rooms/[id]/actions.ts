import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Helper to get or initialize the Firebase Admin App.
 * Explicitly provides project ID to avoid auth token refresh issues in some environments.
 */
function getAdminApp(): App {
  if (getApps().length === 0) {
    return initializeApp({
      projectId: 'studio-7235955659-7c316',
    });
  }
  return getApps()[0];
}

/**
 * Fetches a room's data on the server for metadata generation.
 * Wrapped in an aggressive try-catch to prevent 500 errors if auth fails.
 */
export async function getRoom(id: string) {
  if (!id) return null;
  
  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    const doc = await db.collection('rooms').doc(id).get();
    
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as any;
  } catch (error: any) {
    // Gracefully handle failure during metadata generation
    console.warn("Metadata Fetch Warning (getRoom):", error?.message);
    return null;
  }
}

/**
 * Fetches a job's data on the server for metadata generation.
 * Wrapped in an aggressive try-catch to prevent 500 errors if auth fails.
 */
export async function getJob(id: string) {
  if (!id) return null;

  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    const doc = await db.collection('jobs').doc(id).get();
    
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as any;
  } catch (error: any) {
    // Gracefully handle failure during metadata generation
    console.warn("Metadata Fetch Warning (getJob):", error?.message);
    return null;
  }
}
