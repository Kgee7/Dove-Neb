'use server';

import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Server Action to securely increment a room's interest/rating count.
 * This runs on the server with administrative privileges, bypassing client-side security rules.
 */
export async function incrementRoomRating(roomId: string) {
  if (!roomId) return { success: false, error: 'No room ID provided' };

  let app: App;
  if (getApps().length === 0) {
    app = initializeApp();
  } else {
    app = getApps()[0];
  }

  const db = getFirestore(app);

  try {
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
