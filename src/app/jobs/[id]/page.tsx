
'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { Job } from '@/lib/job-data';
import Link from 'next/link';
import FavoriteButton from '@/components/favorite-button';
import ShareButton from '@/components/share-button';
import ApplyButton from '@/components/apply-button';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function JobDetailsPage() {
  const firestore = useFirestore();
  const params = useParams();
  const id = params.id as string;

  const jobDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'jobs', id);
  }, [firestore, id]);

  const { data: job, isLoading } = useDoc<Job>(jobDocRef);
  
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
                {job && <ApplyButton job={job} />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
