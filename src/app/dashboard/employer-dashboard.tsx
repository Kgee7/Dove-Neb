'use client';

import Link from 'next/link';
import { useMemoFirebase, useCollection, useFirestore, useUser, deleteDocument } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase, Loader2, Edit, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { Job } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function EmployerDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const employerJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'jobListings'), where("employerId", "==", user.uid));
  }, [firestore, user]);

  const { data: jobs, isLoading } = useCollection<Job>(employerJobsQuery);

  const handleDelete = (jobId: string) => {
    if (!firestore) return;
    const jobDocRef = doc(firestore, 'jobListings', jobId);
    deleteDocument(jobDocRef);
    toast({
        title: "Job Deleted",
        description: "The job posting has been removed.",
    })
  }

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
                            <div className="flex items-center justify-between p-4">
                                <div>
                                    <h3 className="text-lg font-semibold">{job.title}</h3>
                                    <p className="text-sm text-muted-foreground">{job.location} &middot; {job.type}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link href={`/jobs/${job.id}`}>
                                        <Button variant="outline" size="sm">View</Button>
                                    </Link>
                                    <Link href={`/jobs/${job.id}`}>
                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                            <Edit className="h-4 w-4"/>
                                        </Button>
                                    </Link>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure you want to delete this job?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the job posting.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(job.id)} className="bg-destructive hover:bg-destructive/90">
                                                Delete
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
