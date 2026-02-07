'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, writeBatch, query, collection, where, getDocs } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { Job } from '@/lib/job-data';
import Link from 'next/link';
import FavoriteButton from '@/components/favorite-button';
import ShareButton from '@/components/share-button';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, MapPin, DollarSign, Briefcase, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  resumeURL?: string;
  photoURL?: string;
  userType?: 'seeker' | 'employer';
};


export default function JobDetailsPage() {
  const firestore = useFirestore();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const id = params.id as string;
  
  const [applicationState, setApplicationState] = useState<'idle' | 'loading' | 'applied'>('idle');
  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false);

  const jobDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'jobs', id);
  }, [firestore, id]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobDocRef);
  
  const userDocRef = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user?.uid, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (!user || !firestore || !job) return;

    const checkStatus = async () => {
        const applicationQuery = query(collection(firestore, `users/${user.uid}/applications`), where("jobId", "==", job.id));
        const querySnapshot = await getDocs(applicationQuery);
        if (!querySnapshot.empty) {
            setHasAlreadyApplied(true);
        }
    };
    checkStatus();
  }, [user, firestore, job]);


  const handleApplyClick = async () => {
    if (!user) {
      router.push('/signup?redirect=/jobs/' + id);
      return;
    }

    if (isProfileLoading) return;

    if (userProfile?.userType !== 'seeker') {
        toast({ variant: 'destructive', title: 'Only Job Seekers can apply.'});
        return;
    }
    
    if (!userProfile.resumeURL) {
        toast({ variant: 'destructive', title: 'Resume Required', description: 'Please upload a resume to your profile before applying.'});
        router.push('/profile');
        return;
    }

    setApplicationState('loading');
    if (!firestore || !job) {
        setApplicationState('idle');
        toast({ variant: 'destructive', title: 'Error', description: 'Job data is not available.' });
        return;
    }
    
    try {
        const seekerName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
        const applicantId = uuidv4();
        const applicationId = uuidv4();
        const appliedAt = new Date();

        const applicantData = {
            id: applicantId,
            seekerId: user.uid,
            seekerName,
            seekerEmail: userProfile.email,
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
        
        setApplicationState('applied');
        toast({
            title: 'Application Sent!',
            description: `You have successfully applied for the ${job.title} position.`,
        });

    } catch(error: any) {
        setApplicationState('idle');
        toast({ variant: 'destructive', title: 'Application Failed', description: error.message || 'Could not submit your application.' });
    }
  };

  const isLoading = isJobLoading || isUserLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-3xl font-bold">Job not found</h1>
        <p className="text-muted-foreground">This listing may have been removed or the link is incorrect.</p>        
        <Link href="/jobs">
          <Button variant="link" className="mt-4">Back to all jobs</Button>
        </Link>
      </div>
    );
  }
  
  const salarySymbol = job.salaryCurrencySymbol || '$';

  const renderApplySection = () => {
    if (userProfile && userProfile.userType !== 'seeker') {
        return null;
    }
    if (hasAlreadyApplied) {
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
    if (applicationState === 'applied') {
        return (
            <Card className="bg-secondary/20 text-center">
                <CardHeader>
                    <CardTitle className="text-lg">Application Submitted!</CardTitle>
                </CardHeader>
                <CardContent>
                    <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                    <p className="mt-4 font-semibold text-sm">To complete your application, please also send your CV to:</p>
                    <div className="flex items-center justify-center gap-2 mt-2 font-mono p-2 bg-background rounded-md">
                        <Mail className="h-4 w-4" />
                        <span>{job.applicationEmail}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }
    return (
        <Card className="bg-secondary/20">
            <CardHeader className="text-center">
                <CardTitle className="text-lg">Do you want to apply for this job?</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Button onClick={handleApplyClick} className="w-full max-w-sm" disabled={applicationState === 'loading' || isProfileLoading}>
                    {(applicationState === 'loading' || isProfileLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Apply Now
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="bg-muted/40">
      <div className="container max-w-4xl py-12 mx-auto">
        <div className="mb-4">
          <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all jobs
          </Link>
        </div>

        <Card className="relative">
           {job && <FavoriteButton item={job} itemType="job" />}
          <CardHeader>
            <div className='flex justify-between items-start'>
              <div>
                <CardTitle className="text-3xl font-bold font-headline">{job.title}</CardTitle>
                <CardDescription className="text-lg">{job.companyName}</CardDescription>
              </div>
              <ShareButton title={job.title} text={`Check out this job: ${job.title} at ${job.companyName}`} />
            </div>
            <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {job.location}, {job.country}
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> {job.type}
              </div>
              {job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> {salarySymbol}{job.salaryMin.toLocaleString()} - {salarySymbol}{job.salaryMax.toLocaleString()}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="my-4" />
            <div>
              <div>
                <h3 className="font-semibold text-xl mb-3">About the Job</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {job.description}
                </div>
              </div>
              <div className='mt-8'>
                {renderApplySection()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
