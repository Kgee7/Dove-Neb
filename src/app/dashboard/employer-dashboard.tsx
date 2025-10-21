'use client';

import Link from 'next/link';
import { useMemoFirebase, useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Job } from '@/lib/data';

export default function EmployerDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const employerJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Query jobListings where employerId matches the current user's UID
    return query(collection(firestore, 'jobListings'), where("employerId", "==", user.uid));
  }, [firestore, user]);

  const { data: jobs, isLoading } = useCollection<Job>(employerJobsQuery);

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Employer Dashboard</h1>
          <p className="text-muted-foreground">Manage your job postings and applicants.</p>
        </div>
        <Link href="/dashboard/post-job">
          <Button className="bg-accent hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4"/>
            Post a New Job
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Job Postings</CardTitle>
          {isLoading && (
             <CardDescription>Loading your job postings...</CardDescription>
          )}
          {!isLoading && (!jobs || jobs.length === 0) && (
            <CardDescription>
                You have no active job postings.
            </CardDescription>
          )}
           {!isLoading && jobs && jobs.length > 0 && (
            <CardDescription>
                You have {jobs.length} active job posting{jobs.length > 1 ? 's' : ''}.
            </CardDescription>
          )}
        </CardHeader>
        {isLoading ? (
            <CardContent className="flex justify-center items-center p-12">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        ) : !jobs || jobs.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
            <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Jobs Posted Yet</h3>
            <p className="text-muted-foreground mb-4">Get started by posting your first job opening.</p>
            <Link href="/dashboard/post-job">
                <Button className="bg-accent hover:bg-accent/90">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Post a Job
                </Button>
            </Link>
          </CardContent>
        ) : (
            <CardContent>
                <div className="grid gap-4">
                    {jobs.map(job => (
                        <Card key={job.id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">{job.title}</CardTitle>
                                    <CardDescription>{job.location} &middot; {job.type}</CardDescription>
                                </div>
                                <Link href={`/jobs/${job.id}`}>
                                    <Button variant="outline">View</Button>
                                </Link>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
