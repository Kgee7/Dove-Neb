
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection, query, orderBy, writeBatch } from 'firebase/firestore';
import { useDoc, useCollection, useFirestore, useUser } from '@/firebase';
import { Job, JobApplicant } from '@/lib/job-data';
import Link from 'next/link';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Download, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

function DownloadResumeButton({ resumePath }: { resumePath: string | undefined }) {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!resumePath) {
            toast({ variant: 'destructive', title: 'No Resume', description: 'This applicant has not provided a resume.' });
            return;
        }

        setIsDownloading(true);
        try {
            // For data URIs, we just open them in a new tab.
            window.open(resumePath, '_blank');
        } catch (error: any) {
            console.error("Error opening resume:", error);
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: error.message || 'Could not download the resume.',
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Resume
        </Button>
    );
}

export default function JobApplicantsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const [applicantToDelete, setApplicantToDelete] = useState<JobApplicant | null>(null);


  const jobDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'jobs', id);
  }, [firestore, id]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobDocRef);

  // Directly check authorization and handle redirects in an effect.
  // This is safer than setting a state that then triggers the query.
  useEffect(() => {
    if (isUserLoading || isJobLoading) {
      return; // Wait until all data is loaded.
    }
    if (!user) {
      router.push('/login'); // Not logged in.
      return;
    }
    if (!job || job.employerId !== user.uid) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You are not authorized to view these applicants.',
      });
      router.push('/dashboard'); // Not the owner or job doesn't exist.
    }
  }, [isUserLoading, isJobLoading, user, job, router, toast]);


  // The query is now gated by all necessary data being loaded and authorized.
  // It will remain `null` until the user is confirmed to be the owner, preventing permission errors.
  const applicantsQuery = useMemo(() => {
    if (isUserLoading || isJobLoading || !user || !job || user.uid !== job.employerId) {
      return null;
    }
    return query(collection(firestore!, `jobs/${id}/applicants`), orderBy('appliedAt', 'desc'));
  }, [isUserLoading, isJobLoading, user, job, firestore, id]);

  const { data: applicants, isLoading: areApplicantsLoading } = useCollection<JobApplicant>(applicantsQuery);
  
  const maskEmail = (email: string | undefined): string => {
    if (!email || !email.includes('@')) {
      return email || '';
    }
    const [name, domain] = email.split('@');
    return `${name.substring(0, 3)}...` + `@${domain}`;
  };

  const handleDeleteApplicant = async () => {
    if (!firestore || !id || !user || !applicantToDelete) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not perform deletion.' });
        return;
    }

    const { id: applicantId, seekerId, userApplicationId, seekerName } = applicantToDelete;

    if (!seekerId || !userApplicationId) {
        toast({ variant: 'destructive', title: 'Deletion Error', description: 'Cannot find the corresponding user application to delete. The application may be from an older version or corrupted.' });
        setApplicantToDelete(null);
        return;
    }
    
    try {
        const batch = writeBatch(firestore);

        const applicantDocRef = doc(firestore, 'jobs', id, 'applicants', applicantId);
        batch.delete(applicantDocRef);
        
        const userApplicationDocRef = doc(firestore, 'users', seekerId, 'applications', userApplicationId);
        batch.delete(userApplicationDocRef);

        await batch.commit();
        
        toast({
            title: 'Applicant Deleted',
            description: `The application from ${seekerName} has been deleted.`,
        });
    } catch (error: any) {
        console.error("Error deleting application:", error);
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: error.message || 'Could not delete the application.',
        });
    } finally {
        setApplicantToDelete(null);
    }
  };

  // Show a loader while we are verifying access and loading initial data.
  const isLoading = isUserLoading || isJobLoading || (applicantsQuery && areApplicantsLoading);
  
  if (isLoading && !applicants) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // The redirect effect handles unauthorized access, but this serves as a fallback UI.
  if (!job || (user && job.employerId !== user.uid)) {
    return (
     <div className="container py-12 text-center">
       <h1 className="text-3xl font-bold">Access Denied</h1>
       <p className="text-muted-foreground">You are not authorized to view this page.</p>
       <Link href="/dashboard">
         <Button variant="link" className="mt-4">Back to Dashboard</Button>
       </Link>
     </div>
   );
 }

  return (
    <>
    <div className="container py-10">
       <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
        </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Applicants for {job.title}</CardTitle>
          <CardDescription>{applicants?.length ?? 0} application(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {applicants && applicants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map(applicant => (
                  <TableRow key={applicant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={applicant.photoURL} />
                          <AvatarFallback>{applicant.seekerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{applicant.seekerName}</p>
                            <p className="text-sm text-muted-foreground">{maskEmail(applicant.seekerEmail)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{format(applicant.appliedAt.toDate(), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">Check inbox for email/WhatsApp</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DownloadResumeButton resumePath={applicant.resumeURL} />
                        <Button variant="destructive" size="sm" onClick={() => setApplicantToDelete(applicant)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='text-center py-20 border-2 border-dashed rounded-lg'>
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No applicants yet.</h3>
                <p className="mt-1 text-sm text-muted-foreground">Check back later to see who has applied.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={!!applicantToDelete} onOpenChange={(open) => !open && setApplicantToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete {applicantToDelete?.seekerName}'s application. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteApplicant}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
