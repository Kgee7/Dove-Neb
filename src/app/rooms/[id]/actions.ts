'use server';

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK for server-side operations
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "studio-7235955659-7c316",
  });
}

const db = admin.firestore();

/**
 * Checks if a user has already expressed interest in a room.
 * This runs on the server to bypass client-side security rules.
 */
export async function checkInterestStatus(roomId: string, userId: string) {
  if (!roomId || !userId) return false;
  try {
    const doc = await db.collection('rooms').doc(roomId).collection('ratings').doc(userId).get();
    return doc.exists;
  } catch (error) {
    console.error("Error checking interest status on server:", error);
    return false;
  }
}

/**
 * Records a user's interest in a room and "rates" it by incrementing a counter.
 * This runs on the server to bypass client-side security rules.
 */
export async function recordInterestAction(roomId: string, userId: string, userName: string) {
  if (!roomId || !userId) throw new Error("Missing parameters");
  
  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const ratingRef = roomRef.collection('ratings').doc(userId);
    
    // Check if interest already exists to prevent multiple counts from the same user
    const existingInterest = await ratingRef.get();
    
    const batch = db.batch();
    
    // Always set/update the interest marker
    batch.set(ratingRef, {
      userId,
      userName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type: 'interest'
    }, { merge: true });

    // Only increment the "rating" count if this is a new interest for this user
    if (!existingInterest.exists) {
        batch.update(roomRef, {
          interestCount: admin.firestore.FieldValue.increment(1)
        });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error recording interest on server:", error);
    throw new Error("Failed to record interest");
  }
}
