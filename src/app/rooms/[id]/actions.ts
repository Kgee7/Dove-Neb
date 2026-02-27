'use server';

/**
 * This file is currently not in use.
 * Interest tracking logic has been moved to client-side state 
 * to simplify the user experience and avoid database permission issues.
 */

export async function checkInterestStatus(roomId: string, userId: string) {
  return false;
}

export async function recordInterestAction(roomId: string, userId: string, userName: string) {
  return { success: true };
}
