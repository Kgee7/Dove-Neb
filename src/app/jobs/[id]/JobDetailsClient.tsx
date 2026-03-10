'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, writeBatch, query, collection, where, getDocs, addDoc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { Job } from '@/lib/job-data';
import Link from 'next/link';
import FavoriteButton from '@/components/favorite-button';
import ShareButton from '@/components/share-button';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, MapPin, DollarSign, Briefcase, Mail, CheckCircle, MessageSquare } from 'lucide-react';
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

interface JobDetailsClientProps {
  id: string;
}

export default function JobDetailsClient({ id }: JobDetailsClientProps) {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  
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

    // Only block if we are 100% sure they are an employer and NOT the owner
    if (userProfile && userProfile.userType === 'employer' && job?.employerId !== user.uid) {
        // We let them apply for now to be safe, or show specific error
    }
    
    if (!userProfile?.resumeURL) {
        toast({ 
            variant: 'destructive', 
            title: 'Resume Required', 
            description: 'Please upload a resume to your profile before applying.'
        });
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
            applicationMethod: job.applicationMethod,
            applicationContact: job.applicationMethod === 'email' ? job.applicationEmail : job.applicationWhatsapp,
        };

        const batch = writeBatch(firestore);
        
        const applicantRef = doc(firestore, 'jobs', job.id, 'applicants', applicantId);
        batch.set(applicantRef, applicantData);

        const applicationRef = doc(firestore, 'users', user.uid, 'applications', applicationId);
        batch.set(applicationRef, applicationData);

        const notificationRef = doc(collection(firestore, 'users', user.uid, 'notifications'));
        batch.set(notificationRef, {
            id: notificationRef.id,
            title: 'Application Sent',
            message: `Your application for "${job.title}" at "${job.companyName}" has been submitted successfully.`,
            type: 'info',
            read: false,
            createdAt: new Date()
        });

        await batch.commit();

        setApplicationState('applied');
        toast({
            title: 'Application Sent!',
            description: `Successfully applied for ${job.title}.`,
        });

    } catch(error: any) {
        setApplicationState('idle');
        toast({ variant: 'destructive', title: 'Application Failed', description: error.message || 'Could not submit.' });
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
      <div className="container py-12 text-center px-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Job not found</h1>
        <p className="text-sm text-muted-foreground mt-2">Listing removed or incorrect link.</p>        
        <Link href="/jobs">
          <Button variant="link" className="mt-4">Back to all jobs</Button>
        </Link>
      </div>
    );
  }
  
  const salarySymbol = job.salaryCurrencySymbol || '$';

  const renderApplySection = () => {
    // Hide ONLY for the job poster
    const isJobPoster = user && job && job.employerId === user.uid;

    if (isJobPoster) {
        return (
            <Card className="bg-muted border-dashed">
                <CardHeader className="p-4 sm:p-6 text-center">
                    <CardTitle className="text-base sm:text-lg">Your Listing</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">You posted this job. Manage applicants from your dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex justify-center">
                    <Link href={`/dashboard/jobs/${job.id}/applicants`} className="w-full max-w-sm">
                        <Button variant="outline" className="w-full h-10 sm:h-11">
                            View Applicants
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    if (hasAlreadyApplied) {
        return (
            <Card className="bg-secondary/10 border-secondary/20">
                <CardHeader className="p-4 sm:p-6 text-center">
                    <CardTitle className="text-base sm:text-lg">Application Status</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">You have already submitted an application for this role.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex justify-center">
                    <Button disabled className="w-full max-w-sm h-10 sm:h-11">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Application Sent
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (applicationState === 'applied') {
        return (
            <Card className="bg-green-50/50 border-green-100 text-center">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg text-green-800">Application Submitted!</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-4" />
                    <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3">To finish, send your cv/cover letter to:</p>
                    <div className="flex items-center justify-center gap-2 font-mono p-3 bg-background border rounded-lg shadow-sm text-xs sm:text-sm break-all">
                        {job.applicationMethod === 'email' ? <Mail className="h-4 w-4 shrink-0" /> : <MessageSquare className="h-4 w-4 shrink-0" />}
                        <span>{job.applicationMethod === 'email' ? job.applicationEmail : job.applicationWhatsapp}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-primary/[0.02] border-primary/10 shadow-md">
            <CardHeader className="text-center p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Apply for this role</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your profile and resume will be shared with the employer.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-4 sm:p-6 pt-0">
                <Button onClick={handleApplyClick} className="w-full max-w-sm h-11 sm:h-12 text-sm sm:text-base font-bold" disabled={applicationState === 'loading' || (user && isProfileLoading)}>
                    {(applicationState === 'loading' || (user && isProfileLoading)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Apply Now
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="bg-muted/40 min-h-screen">
      <div className="container max-w-4xl py-6 sm:py-12 mx-auto px-4">
        <div className="mb-4">
          <Link href="/jobs" className="inline-flex items-center text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Back to job listings
          </Link>
        </div>

        <Card className="relative shadow-xl border-muted/60">
           {job && <FavoriteButton item={job} itemType="job" />}
          <CardHeader className="p-5 sm:p-8">
            <div className='flex flex-col sm:flex-row justify-between items-start gap-4'>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl sm:text-3xl font-bold font-headline leading-tight">{job.title}</CardTitle>
                <CardDescription className="text-base sm:text-lg text-primary font-medium mt-1">{job.companyName}</CardDescription>
              </div>
              <ShareButton title={job.title} text={`Check out this job: ${job.title} at ${job.companyName}`} className="shrink-0" />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-4 text-xs sm:text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary/60" /> {job.location}, {job.country}
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-primary/60" /> {job.type}
              </div>
              {job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-primary/60" /> {salarySymbol}{job.salaryMin.toLocaleString()} - {salarySymbol}{job.salaryMax.toLocaleString()}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-8 pt-0 sm:pt-0">
            <Separator className="my-6" />
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-lg sm:text-xl mb-4 text-foreground">Role Description</h3>
                <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {job.description}
                </div>
              </div>
              <div className='pt-4'>
                {renderApplySection()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
