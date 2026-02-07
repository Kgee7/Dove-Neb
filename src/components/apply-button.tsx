
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { Job } from '@/lib/job-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  resumeURL?: string;
  photoURL?: string;
  userType?: 'seeker' | 'employer';
};

export default function ApplyButton({ job }: { job: Job }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<'idle' | 'confirming' | 'loading' | 'applied' | 'no-resume' | 'error' | 'already-applied'>('idle');

  const userDocRef = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user?.uid, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (isUserLoading || isProfileLoading) {
        setStep('loading');
        return;
      }
      if (!user) {
        setStep('idle');
        return;
      }

      if (firestore) {
        const q = query(collection(firestore, `users/${user.uid}/applications`), where("jobId", "==", job.id));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setStep('already-applied');
        } else {
          setStep('idle');
        }
      }
    };
    checkApplicationStatus();
  }, [user, isUserLoading, isProfileLoading, firestore, job.id]);


  const handleInitialApplyClick = () => {
    if (!user) {
      router.push('/signup?redirect=/jobs/' + job.id);
      return;
    }
    if (userProfile?.userType !== 'seeker') {
        toast({ variant: 'destructive', title: 'Only Job Seekers can apply.'});
        return;
    }
    setStep('confirming');
  };

  const handleConfirmApply = async () => {
    if (!user || !userProfile || !firestore || !job) {
      toast({
        variant: 'destructive',
        title: 'Application Error',
        description: 'Could not process your application. Please try again.',
      });
      return;
    }

    if (!userProfile.resumeURL) {
        setStep('no-resume');
        return;
    }

    setStep('loading');

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
        userApplicationId: applicationId,
      };

      const applicationData = {
        id: applicationId,
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.companyName,
        seekerId: user.uid,
        status: 'pending',
        appliedAt,
        applicantDocId: applicantId,
      };

      const batch = writeBatch(firestore);
      
      const applicantRef = doc(firestore, 'jobs', job.id, 'applicants', applicantId);
      batch.set(applicantRef, applicantData);

      const applicationRef = doc(firestore, 'users', user.uid, 'applications', applicationId);
      batch.set(applicationRef, applicationData);

      await batch.commit();

      setStep('applied');
      toast({
        title: 'Application Sent!',
        description: `${seekerName} has applied for a ${job.title} position.`,
      });

    } catch (error: any) {
      setStep('error');
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error.message || 'Could not submit your application.',
      });
    }
  };
  
  if (userProfile && userProfile.userType !== 'seeker') {
    return null; // Hide for employers
  }

  if (step === 'loading') {
    return (
        <Card className="bg-secondary/20">
            <CardContent className="flex justify-center items-center p-6 min-h-[150px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
        </Card>
    );
  }

  if (step === 'already-applied') {
    return (
        <Card className="bg-secondary/20">
            <CardHeader>
                <CardTitle className="text-lg">Application Sent</CardTitle>
                <CardDescription>You have already applied for this position.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Button disabled className="w-full max-w-sm">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Applied
                </Button>
            </CardContent>
        </Card>
    );
  }

  if (step === 'no-resume') {
    return (
        <Card className="bg-secondary/20 text-center">
            <CardHeader>
                 <CardTitle className="text-lg">Resume Required</CardTitle>
            </CardHeader>
            <CardContent>
                <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                <p className="mt-2 text-sm font-semibold">You need a resume to apply.</p>
                <p className="mt-1 text-xs text-muted-foreground">Please upload one to your profile.</p>
                <Link href="/profile">
                    <Button variant="default" size="sm" className="mt-3">Go to Profile</Button>
                </Link>
            </CardContent>
        </Card>
    );
  }
  
  if (step === 'applied') {
    return (
        <Card className="bg-secondary/20 text-center">
             <CardHeader>
                <CardTitle className="text-lg">Application Successful!</CardTitle>
            </CardHeader>
            <CardContent>
                <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2 text-sm text-muted-foreground">Your application has been submitted.</p>
                <p className="mt-4 font-semibold text-sm">To complete your application, please also send your CV to:</p>
                <div className="flex items-center justify-center gap-2 mt-2 font-mono p-2 bg-background rounded-md">
                   <Mail className="h-4 w-4" />
                   <span>{job.applicationEmail}</span>
                </div>
            </CardContent>
        </Card>
    )
  }

  if (step === 'confirming') {
     return (
        <Card className="bg-secondary/20">
            <CardHeader className="text-center">
                <CardTitle className="text-lg">Apply for this job?</CardTitle>
                <CardDescription>This will submit your profile and resume to the employer.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
                <Button onClick={handleConfirmApply} className="w-full">
                    Yes, Apply Now
                </Button>
                <Button onClick={() => setStep('idle')} variant="outline" className="w-full">
                    Cancel
                </Button>
            </CardContent>
        </Card>
    );
  }

  // default 'idle' state
  return (
    <Card className="bg-secondary/20">
        <CardHeader>
            <CardTitle className="text-lg">Ready to Apply?</CardTitle>
            <CardDescription>Submit your application with one click.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
            <Button onClick={handleInitialApplyClick} className="w-full max-w-sm">
                Apply Now
            </Button>
        </CardContent>
    </Card>
  );
}
