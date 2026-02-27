'use server';

import * as admin from 'firebase-admin';

// Helper to safely get the Firestore instance with guaranteed initialization
function getDb() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        projectId: "studio-7235955659-7c316",
      });
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  }
  return admin.firestore();
}

/**
 * Checks if a user has already expressed interest in a room.
 * This runs on the server to bypass client-side security rules.
 */
export async function checkInterestStatus(roomId: string, userId: string) {
  if (!roomId || !userId) return false;
  try {
    const db = getDb();
    const doc = await db.collection('rooms').doc(roomId).collection('ratings').doc(userId).get();
    return doc.exists;
  } catch (error) {
    console.error("Error checking interest status on server:", error);
    return false;
  }
}

/**
 * Records a user's interest in a room and "rates" it by incrementing a counter.
 * Uses a transaction to ensure atomic updates.
 * Returns a result object to avoid "unexpected response" errors on the client.
 */
export async function recordInterestAction(roomId: string, userId: string, userName: string) {
  if (!roomId || !userId) {
    return { success: false, error: "Missing required parameters: roomId or userId" };
  }
  
  try {
    const db = getDb();
    const roomRef = db.collection('rooms').doc(roomId);
    const ratingRef = roomRef.collection('ratings').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      const ratingDoc = await transaction.get(ratingRef);

      if (!roomDoc.exists) {
        throw new Error("The room listing no longer exists.");
      }

      // 1. Record/Update the specific user's interest marker
      transaction.set(ratingRef, {
        userId,
        userName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'interest'
      }, { merge: true });

      // 2. Increment global room interest count only if this is a NEW interest for this user
      if (!ratingDoc.exists) {
        transaction.update(roomRef, {
          interestCount: admin.firestore.FieldValue.increment(1)
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("CRITICAL ERROR in recordInterestAction:", error);
    return { 
      success: false, 
      error: error.message || "Could not record your interest. Please try again later." 
    };
  }
}
