'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { Job } from '@/lib/job-data';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, MapPin, Building2, DollarSign, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";

export default function JobDetailsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [applying, setApplying] = useState(false);

  const jobDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'jobs', id);
  }, [firestore, id]);

  const { data: job, isLoading } = useDoc<Job>(jobDocRef);

  const handleApply = async () => {
    if (!user || !job) {
      toast({
        variant: "destructive",
        title: "Application Failed",
        description: "You must be logged in to apply for a job.",
      });
      router.push(`/login?redirect=/jobs/${id}`);
      return;
    }
    setApplying(true);
    try {
      const applicationsCollectionRef = collection(firestore, 'users', user.uid, 'applications');
      await addDoc(applicationsCollectionRef, {
        jobId: job.id,
        seekerId: user.uid,
        status: 'pending',
        appliedAt: serverTimestamp(),
        jobTitle: job.title,
        companyName: job.companyName,
      });

      toast({
        title: "Application Successful!",
        description: `You have applied for the ${job.title} position.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Application Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setApplying(false);
    }
  };

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

  return (
    <div className="bg-muted/40">
      <div className="container max-w-4xl py-12">
        <div className="mb-4">
          <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all jobs
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline">{job.title}</CardTitle>
            <CardDescription className="text-lg">{job.companyName}</CardDescription>
            <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> {job.type}
              </div>
              {job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="my-4" />
            <h3 className="font-semibold text-xl mb-3">About the Job</h3>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                {job.description}
            </div>
            <Separator className="my-6" />
            <div className="flex justify-center">
              <Button onClick={handleApply} size="lg" disabled={applying}>
                {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Apply Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
