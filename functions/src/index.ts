/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

interface UpdateStatusData {
    jobId: string;
    applicantId: string;
    seekerId: string;
    newStatus: "pending" | "reviewed" | "rejected" | "hired";
}

export const updateApplicationStatus = onCall(async (request) => {
  // 1. Authentication Check: Ensure the user is logged in.
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "You must be logged in to update an application status.",
    );
  }

  const {jobId, applicantId, seekerId, newStatus} = request.data as UpdateStatusData;
  const employerId = request.auth.uid;

  logger.info(`Attempting to update status for applicant ${applicantId} on job ${jobId} to ${newStatus} by employer ${employerId}`);

  try {
    const jobDocRef = db.collection("jobs").doc(jobId);
    const jobDoc = await jobDocRef.get();

    // 2. Authorization Check: Ensure the caller owns the job.
    if (!jobDoc.exists || jobDoc.data()?.employerId !== employerId) {
      throw new HttpsError(
          "permission-denied",
          "You are not authorized to update applicants for this job.",
      );
    }

    // Start a transaction to update both documents atomically.
    await db.runTransaction(async (transaction) => {
      // Find the seeker's application first (READ operation)
      const userApplicationsQuery = db
          .collection("users")
          .doc(seekerId)
          .collection("applications")
          .where("jobId", "==", jobId);

      const userApplicationsSnapshot = await transaction.get(userApplicationsQuery);

      // Now perform the WRITE operations
      // 3. Update the applicant document in the employer's subcollection.
      const applicantDocRef = jobDocRef.collection("applicants").doc(applicantId);
      transaction.update(applicantDocRef, {status: newStatus});

      // 4. Update the corresponding application in the seeker's subcollection.
      if (userApplicationsSnapshot.empty) {
        // This is not a fatal error, but worth logging.
        // It could happen if the user deletes their application record.
        logger.warn(`Could not find application for seeker ${seekerId} on job ${jobId}. Only employer record updated.`);
      } else {
        // Assuming one application per user per job.
        const userApplicationDocRef = userApplicationsSnapshot.docs[0].ref;
        transaction.update(userApplicationDocRef, {status: newStatus});
      }
    });

    logger.info("Successfully updated application status in transaction.");
    return {success: true, newStatus};
  } catch (error) {
    logger.error("Error updating application status:", error);
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsError directly
    }
    // For other errors, wrap them in a generic HttpsError.
    throw new HttpsError(
        "internal",
        "An unexpected error occurred while updating the status.",
    );
  }
});
