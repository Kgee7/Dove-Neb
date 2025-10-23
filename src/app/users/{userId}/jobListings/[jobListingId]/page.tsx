
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { Job } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Briefcase, Building, Mail, Phone, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function JobListingPage() {
  const firestore = useFirestore();
  const params = useParams();
  const userId = params.userId as string;
  const jobListingId = params.jobListingId as string;

  const jobDocRef = useMemo(() => {
    if (!firestore || !userId || !jobListingId) return null;
    return doc(firestore, 'users', userId, 'jobListings', jobListingId);
  }, [firestore, userId, jobListingId]);

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
                    <div className={cn("flex h-48 items-center justify-center bg-cover bg-center p-6", job.logoBg || 'bg-secondary')}>
                        <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-white/80 p-2 backdrop-blur-sm">
                            <Image
                                src={job.logoUrl}
                                alt={`${job.company} logo`}
                                width={80}
                                height={80}
                                className="rounded-md object-contain"
                            />
                        </div>
                    </div>
                     <div className="p-6">
                        <Badge variant="outline">{job.type}</Badge>
                        <CardTitle className="mt-2 text-3xl font-bold font-headline">{job.title}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span>{job.company}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {job.workArrangement === 'Remote' ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                <span>{job.location}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="grid gap-8 p-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <div>
                            <h4 className="font-semibold text-lg">Job Description</h4>
                            <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                        </div>
                        {job.requirements && job.requirements.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-lg">Requirements</h4>
                                <ul className="mt-2 list-disc list-inside space-y-2 text-muted-foreground">
                                    {job.requirements.map((req, index) => (
                                    <li key={index}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <aside className="space-y-4 md:col-span-1">
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Job Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-muted-foreground">Posted Date</span>
                                    <span>{job.postedDate}</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="font-semibold text-muted-foreground">Closing Date</span>
                                    <span>{job.closingDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-muted-foreground">Job Type</span>
                                    <span>{job.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-muted-foreground">Salary</span>
                                    <span className="font-bold">{job.currencySymbol}{job.salary}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Button className="w-full bg-accent hover:bg-accent/90">Apply Now</Button>
                    </aside>
                </CardContent>
                <CardFooter className="flex-wrap gap-2 border-t p-6">
                    <h4 className="text-sm font-semibold">Contact:</h4>
                    {job.applicationEmail && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${job.applicationEmail}`} className="hover:underline">{job.applicationEmail}</a>
                        </div>
                    )}
                     {job.applicationWhatsApp && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{job.applicationWhatsApp}</span>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
