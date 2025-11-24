'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { applyForJob } from '@/ai/flows/apply-for-job-flow';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type UserProfile = {
  resumeURL?: string;
  userType?: 'seeker' | 'employer';
};

type JobApplication = {
  jobId: string;
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
  
  const applicationsQuery = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, `users/${user.uid}/applications/${jobId}`);
  }, [user?.uid, firestore, jobId]);
  const { data: existingApplication, isLoading: isApplicationLoading } = useDoc<JobApplication>(applicationsQuery);

  useEffect(() => {
      if (isUserLoading || isProfileLoading || isApplicationLoading) {
          setApplicationState('loading');
          return;
      }
      if (!user) {
          setApplicationState('idle'); // User can see the button but will be prompted to log in
          return;
      }
       if (userProfile?.userType !== 'seeker') {
           setApplicationState('idle'); // Hide for non-seekers
           return;
       }
      if (existingApplication) {
          setApplicationState('already-applied');
          return;
      }
      if (!userProfile?.resumeURL) {
          setApplicationState('no-resume');
          return;
      }
      setApplicationState('idle');
  }, [user, isUserLoading, userProfile, isProfileLoading, existingApplication, isApplicationLoading]);


  const handleApply = async () => {
    if (!user || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'Please log in',
        description: 'You must be logged in as a Job Seeker to apply.',
      });
      return;
    }

    setApplicationState('loading');

    try {
      const result = await applyForJob({ jobId, seekerId: user.uid });
      if (result.success) {
        setApplicationState('applied');
        toast({
          title: 'Application Sent!',
          description: 'Your application has been submitted successfully.',
        });
      } else {
        if (result.message.includes('already applied')) {
            setApplicationState('already-applied');
        } else {
            setApplicationState('error');
        }
        toast({
          variant: 'destructive',
          title: 'Application Failed',
          description: result.message,
        });
      }
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
