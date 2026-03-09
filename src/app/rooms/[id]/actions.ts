
'use server';

import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
 * Server Action to securely increment a room's interest/rating count.
 * This runs on the server with administrative privileges.
 */
export async function incrementRoomRating(roomId: string) {
  if (!roomId) return { success: false, error: 'No room ID provided' };

  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    const roomRef = db.collection('rooms').doc(roomId);
    
    // Atomically increment the interestCount field
    await roomRef.update({
      interestCount: FieldValue.increment(1)
    });

    return { success: true };
  } catch (error: any) {
    console.error("Server Action Error (incrementRoomRating):", error?.message || "Unknown error");
    return { success: false, error: 'Failed to record rating' };
  }
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
    console.warn("Metadata Fetch Warning (getRoom):", error?.message || "Credentials not available");
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
    console.warn("Metadata Fetch Warning (getJob):", error?.message || "Credentials not available");
    return null;
  }
}
