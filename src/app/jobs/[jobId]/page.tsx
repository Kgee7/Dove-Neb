
'use client';

import React, { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { Job } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Briefcase, Building, Mail, Phone, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function JobDetailsPage({ params }: { params: { jobId: string } }) {
  const firestore = useFirestore();

  const jobDocRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'jobListings', params.jobId);
  }, [firestore, params.jobId]);

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
        <div className="container max-w-5xl py-12">
             <div className="mb-8">
                <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to all jobs
                </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-start gap-4">
                            <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Image
                                    src={job.logoUrl}
                                    alt={`${job.company} logo`}
                                    width={60}
                                    height={60}
                                    className="rounded-md object-contain"
                                />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold font-headline">{job.title}</CardTitle>
                                <p className="text-lg text-muted-foreground font-semibold">{job.company}</p>
                                <div className="flex flex-wrap gap-2 text-sm mt-2">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        {job.type}
                                    </Badge>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        {job.workArrangement === 'Remote' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                        {job.location}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Separator className="my-6" />
                            <div>
                                <h3 className="text-xl font-bold mb-4">Job Description</h3>
                                <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
                            </div>
                            <Separator className="my-6" />
                            <div>
                                <h3 className="text-xl font-bold mb-4">Requirements</h3>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    {Array.isArray(job.requirements) ? job.requirements.map((req, index) => <li key={index}>{req}</li>) : <li>{job.requirements}</li>}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Building className="h-5 w-5 mt-1 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">Company</p>
                                    <p className="text-sm text-muted-foreground">{job.company}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 mt-1 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">Location</p>
                                    <p className="text-sm text-muted-foreground">{job.location}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Briefcase className="h-5 w-5 mt-1 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">Job Type</p>
                                    <p className="text-sm text-muted-foreground">{job.type}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <p className="font-bold text-lg mt-1">{job.currencySymbol}</p>
                                <div>
                                    <p className="font-semibold">Salary</p>
                                    <p className="text-sm text-muted-foreground">{job.salary}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 mt-1 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">Closing Date</p>
                                    <p className="text-sm text-muted-foreground">{job.closingDate}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>How to Apply</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {job.applicationEmail && (
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">Email</p>
                                        <a href={`mailto:${job.applicationEmail}`} className="text-sm text-primary hover:underline">
                                            {job.applicationEmail}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {job.applicationWhatsApp && (
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">WhatsApp</p>
                                        <a href={`https://wa.me/${job.applicationWhatsApp.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                            {job.applicationWhatsApp}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {!job.applicationEmail && !job.applicationWhatsApp && (
                                <p className="text-sm text-muted-foreground">No application details provided. Please check the company's website.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Button className="w-full bg-accent hover:bg-accent/90">Apply Now</Button>
                </div>
            </div>
        </div>
    </div>
  );
}
