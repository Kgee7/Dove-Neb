
'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { Job } from '@/lib/job-data';
import Link from 'next/link';
import FavoriteButton from '@/components/favorite-button';
import ApplyButton from '@/components/apply-button';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, MapPin, DollarSign, Briefcase, Mail } from 'lucide-react';
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
            <CardTitle className="text-3xl font-bold font-headline">{job.title}</CardTitle>
            <CardDescription className="text-lg">{job.companyName}</CardDescription>
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
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h3 className="font-semibold text-xl mb-3">About the Job</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {job.description}
                </div>
              </div>
              <div className='md:col-span-1'>
                 <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-lg">How to Apply</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {job.applicationMethod === 'email' && job.applicationEmail ? (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Send your application to:</p>
                          <a href={`mailto:${job.applicationEmail}`} className="font-semibold text-primary hover:underline flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {job.applicationEmail}
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Application instructions not specified.</p>
                      )}
                    </CardContent>
                  </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
