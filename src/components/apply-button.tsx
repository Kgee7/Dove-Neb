'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import type { Job } from '@/lib/job-data';

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  resumeURL?: string;
  photoURL?: string;
  userType?: 'seeker' | 'employer';
};

export default function ApplyButton({ jobId }: { jobId: string }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [applicationState, setApplicationState] = useState<'idle' | 'loading' | 'applied' | 'no-resume' | 'error' | 'already-applied'>('idle');
  
  const userDocRef = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user?.uid, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const applicationQuery = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    // We can't query by jobId directly without a composite index,
    // but checking the dashboard `applications` collection is a good proxy.
    // The most definitive check is done during the apply action.
    return collection(firestore, `users/${user.uid}/applications`);
  }, [user?.uid, firestore]);

  const jobDocRef = useMemo(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'jobs', jobId);
  }, [firestore, jobId]);
  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobDocRef);
  
  // This effect determines the initial state of the button
  useEffect(() => {
    const checkExistingApplication = async () => {
        if (isUserLoading || isProfileLoading || isJobLoading) {
            setApplicationState('loading');
            return;
        }
        if (!user) {
            setApplicationState('idle'); // Not logged in, can attempt to apply
            return;
        }
        if (userProfile?.userType !== 'seeker') {
           return; // Button is hidden anyway, no state needed
        }

        // Check if user has already applied by querying their own applications
        if (firestore && user) {
            const q = query(collection(firestore, `users/${user.uid}/applications`), where("jobId", "==", jobId));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                 setApplicationState('already-applied');
                 return;
            }
        }
        
        if (!userProfile?.resumeURL) {
            setApplicationState('no-resume');
            return;
        }
        setApplicationState('idle');
    };
    checkExistingApplication();

  }, [user, isUserLoading, userProfile, isProfileLoading, jobId, firestore, isJobLoading]);


  const handleApply = async () => {
    if (!user || !userProfile || !firestore || !job) {
      toast({
        variant: 'destructive',
        title: 'Please log in',
        description: 'You must be logged in as a Job Seeker to apply.',
      });
      return;
    }

    setApplicationState('loading');

    try {
      const seekerName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
      const applicantId = uuidv4();
      const applicationId = uuidv4();
      const appliedAt = new Date();

      const applicantData = {
        id: applicantId,
        seekerId: user.uid,
        seekerName,
        seekerEmail: user.email,
        resumeURL: userProfile.resumeURL,
        photoURL: userProfile.photoURL || null,
        status: 'pending',
        appliedAt,
        userApplicationId: applicationId, // Link to the user's application document
      };

      const applicationData = {
        id: applicationId,
        jobId,
        jobTitle: job.title,
        companyName: job.companyName,
        seekerId: user.uid,
        status: 'pending',
        appliedAt,
        applicantDocId: applicantId, // Link to the document in the employer's subcollection
      };

      const batch = writeBatch(firestore);
      
      const applicantRef = doc(firestore, 'jobs', jobId, 'applicants', applicantId);
      batch.set(applicantRef, applicantData);

      const applicationRef = doc(firestore, 'users', user.uid, 'applications', applicationId);
      batch.set(applicationRef, applicationData);

      await batch.commit();

      setApplicationState('applied');
      toast({
        title: 'Application Sent!',
        description: 'Your application has been submitted successfully.',
      });

    } catch (error: any) {
      setApplicationState('error');
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error.message || 'Could not submit your application.',
      });
    }
  };

  const isLoading = applicationState === 'loading';

  if (!isUserLoading && userProfile?.userType !== 'seeker') {
    return null; // Don't show the button for employers
  }

  if (applicationState === 'applied' || applicationState === 'already-applied') {
    return (
      <Button disabled className="w-full max-w-sm">
        <CheckCircle className="mr-2 h-4 w-4" />
        Applied
      </Button>
    );
  }
  
  if (applicationState === 'no-resume') {
    return (
       <div className="text-center p-4 border-2 border-dashed rounded-lg max-w-sm w-full">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <p className="mt-2 text-sm font-semibold">You need a resume to apply.</p>
            <p className="mt-1 text-xs text-muted-foreground">Please upload one to your profile.</p>
            <Link href="/profile">
                <Button variant="default" size="sm" className="mt-3">Go to Profile</Button>
            </Link>
        </div>
    );
  }

  return (
    <Button onClick={handleApply} disabled={isLoading} className="w-full max-w-sm">
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        'Apply Now'
      )}
    </Button>
  );
}
