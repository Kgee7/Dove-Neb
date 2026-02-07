'use server';
/**
 * @fileOverview A flow for handling job applications.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

const ApplyForJobInputSchema = z.object({
  jobId: z.string(),
  seekerId: z.string(),
});
export type ApplyForJobInput = z.infer<typeof ApplyForJobInputSchema>;

const ApplyForJobOutputSchema = z.object({
  success: z.boolean(),
  applicationId: z.string().optional(),
  applicantId: z.string().optional(),
  message: z.string(),
});
export type ApplyForJobOutput = z.infer<typeof ApplyForJobOutputSchema>;

export async function applyForJob(input: ApplyForJobInput): Promise<ApplyForJobOutput> {
  return applyForJobFlow(input);
}

const applyForJobFlow = ai.defineFlow(
  {
    name: 'applyForJobFlow',
    inputSchema: ApplyForJobInputSchema,
    outputSchema: ApplyForJobOutputSchema,
  },
  async ({ jobId, seekerId }) => {
    const firestore = getFirestore();

    try {
      // 1. Get Seeker and Job data
      const seekerDoc = await firestore.collection('users').doc(seekerId).get();
      const jobDoc = await firestore.collection('jobs').doc(jobId).get();

      if (!seekerDoc.exists) {
        return { success: false, message: 'User profile not found.' };
      }
      if (!jobDoc.exists) {
        return { success: false, message: 'Job listing not found.' };
      }

      const seekerData = seekerDoc.data()!;
      const jobData = jobDoc.data()!;
      
      const seekerName = `${seekerData.firstName} ${seekerData.lastName}`.trim();

      // Check for resume
      if (!seekerData.resumeURL) {
        return { success: false, message: 'You must upload a resume to your profile before applying.' };
      }

      // Check if already applied
      const applicantQuery = await firestore.collection('jobs').doc(jobId).collection('applicants').where('seekerId', '==', seekerId).limit(1).get();
      if (!applicantQuery.empty) {
        return { success: false, message: 'You have already applied for this job.' };
      }

      const applicantId = uuidv4();
      const applicationId = uuidv4();
      const appliedAt = new Date();

      const applicantData = {
        id: applicantId,
        seekerId,
        seekerName,
        seekerEmail: seekerData.email,
        resumeURL: seekerData.resumeURL,
        photoURL: seekerData.photoURL || null,
        status: 'pending',
        appliedAt,
        userApplicationId: applicationId, // Link to the user's application document
      };

      const applicationData = {
        id: applicationId,
        jobId,
        jobTitle: jobData.title,
        companyName: jobData.companyName,
        seekerId,
        status: 'pending',
        appliedAt,
        applicantDocId: applicantId, // Link to the document in the employer's subcollection
      };

      // Create documents in a batch
      const batch = firestore.batch();
      
      const applicantRef = firestore.collection('jobs').doc(jobId).collection('applicants').doc(applicantId);
      batch.set(applicantRef, applicantData);

      const applicationRef = firestore.collection('users').doc(seekerId).collection('applications').doc(applicationId);
      batch.set(applicationRef, applicationData);

      await batch.commit();

      return { 
        success: true, 
        message: 'Application submitted successfully!',
        applicationId,
        applicantId,
      };

    } catch (error: any) {
      console.error('Error in applyForJobFlow:', error);
      return { success: false, message: error.message || 'An unexpected error occurred while submitting your application.' };
    }
  }
);
