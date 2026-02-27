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

    console.log(`Successfully incremented rating for room: ${roomId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error incrementing room rating on server:", error);
    return { success: false, error: error.message };
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
  } catch (error) {
    // If Admin SDK fails (e.g. auth issues in dev/prototype), return null to fallback to default metadata
    console.warn("Gracefully handled room metadata fetch failure:", error);
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
  } catch (error) {
    // If Admin SDK fails (e.g. auth issues in dev/prototype), return null to fallback to default metadata
    console.warn("Gracefully handled job metadata fetch failure:", error);
    return null;
  }
}
