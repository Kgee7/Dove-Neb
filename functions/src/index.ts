
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

  const jobDocRef = db.collection("jobs").doc(jobId);
  
  try {
    const jobDoc = await jobDocRef.get();
    // 2. Authorization Check: Ensure the caller owns the job.
    if (!jobDoc.exists || jobDoc.data()?.employerId !== employerId) {
      throw new HttpsError(
          "permission-denied",
          "You are not authorized to update applicants for this job.",
      );
    }

    // 3. Update the applicant document in the employer's subcollection.
    const applicantDocRef = jobDocRef.collection("applicants").doc(applicantId);
    await applicantDocRef.update({status: newStatus});
    logger.info(`Successfully updated employer-side applicant document: /jobs/${jobId}/applicants/${applicantId}`);


    // 4. Find and update the corresponding application in the seeker's subcollection.
    const userApplicationsQuery = db
        .collection("users")
        .doc(seekerId)
        .collection("applications")
        .where("jobId", "==", jobId)
        .limit(1);

    const userApplicationsSnapshot = await userApplicationsQuery.get();

    if (userApplicationsSnapshot.empty) {
      // This is not a fatal error for the employer's side, but worth logging.
      // It could happen if the user deletes their application record.
      logger.warn(`Could not find application for seeker ${seekerId} on job ${jobId}. Only employer record was updated.`);
    } else {
      const userApplicationDocRef = userApplicationsSnapshot.docs[0].ref;
      await userApplicationDocRef.update({status: newStatus});
      logger.info(`Successfully updated seeker-side application document: ${userApplicationDocRef.path}`);
    }

    logger.info("Successfully updated application status using sequential writes.");
    return {success: true, newStatus};
  } catch (error) {
    logger.error("Error during sequential write for application status:", error);
    // If it's already an HttpsError, rethrow it. Otherwise, wrap it.
    if (error instanceof HttpsError) {
        throw error;
    }
    throw new HttpsError(
        "internal",
        "An unexpected error occurred while updating the status.",
    );
  }
});
