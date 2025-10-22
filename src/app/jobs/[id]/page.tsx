
'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { Job } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Briefcase, Building, Mail, Phone, Calendar, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function JobDetailsPage() {
  const firestore = useFirestore();
  const params = useParams();
  const id = params.id as string;

  const jobDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'jobListings', id);
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
        <p className="text-muted-foreground">This job listing may have been removed or the link is incorrect.</p>
        <Link href="/jobs">
          <Button variant="link" className="mt-4">Back to all jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-muted/40">
        <div className="container max-w-4xl py-12">
            <div className="mb-4">
                <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to all jobs
                </Link>
            </div>
            <Card className="overflow-hidden">
                <CardHeader className="p-0">
                    <div className={cn("flex items-center gap-6 p-6", job.logoBg || 'bg-secondary')}>
                         <div className={cn("flex h-20 w-20 shrink-0 items-center justify-center rounded-lg", job.logoBg || 'bg-secondary')}>
                            <Image
                                src={job.logoUrl}
                                alt={`${job.company} logo`}
                                width={60}
                                height={60}
                                className="rounded-md object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
                            <CardTitle className="text-3xl font-bold font-headline">{job.title}</CardTitle>
                        </div>
                    </div>
                     <div className="border-t p-4 sm:p-6 flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline">{job.type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge variant="outline" className="flex items-center gap-1">
                                {job.workArrangement === 'Remote' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                {job.location}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                           <p className="font-semibold text-base">{job.currencySymbol}{job.salary}</p>
                           <p className="text-muted-foreground">({job.currency})</p>
                        </div>
                        <div className="ml-auto text-sm text-muted-foreground">
                            Posted on {job.postedDate}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 p-4 sm:p-6">
                <div>
                    <h4 className="font-semibold text-xl mb-2">Job Description</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>
                {job.requirements && job.requirements.length > 0 && (
                    <div>
                    <h4 className="font-semibold text-xl mb-2">Requirements</h4>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        {job.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                        ))}
                    </ul>
                    </div>
                )}
                 <div className="text-sm text-muted-foreground">
                    Applications close on {new Date(job.closingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4 p-4 sm:p-6 border-t">
                    <h4 className="font-semibold text-xl">How to Apply</h4>
                    <div className="flex items-center gap-4">
                        {job.applicationEmail && (
                            <a href={`mailto:${job.applicationEmail}`} className="inline-block">
                                <Button>
                                    <Mail className="mr-2 h-4 w-4"/>
                                    Apply via Email
                                </Button>
                            </a>
                        )}
                        {job.applicationWhatsApp && (
                             <a href={`https://wa.me/${job.applicationWhatsApp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-block">
                                <Button variant="secondary">
                                    <MessageCircle className="mr-2 h-4 w-4"/>
                                    Apply on WhatsApp
                                </Button>
                            </a>
                        )}
                        {!job.applicationEmail && !job.applicationWhatsApp && (
                            <Link href={`/jobs/apply/${job.id}`}>
                                <Button>Apply Now</Button>
                            </Link>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
