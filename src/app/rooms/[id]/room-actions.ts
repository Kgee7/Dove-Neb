'use server';

import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Helper to get or initialize the Firebase Admin App.
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
 * This is safe to be called from Client Components.
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
