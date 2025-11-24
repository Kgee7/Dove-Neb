
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection, query, orderBy, updateDoc, getDoc } from 'firebase/firestore';
import { useDoc, useCollection, useFirestore, useUser, getStorage, ref, getDownloadURL } from '@/firebase';
import { Job, JobApplicant } from '@/lib/job-data';
import Link from 'next/link';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Download, User, Check, X, MoreHorizontal } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
            const storage = getStorage();
            if (!storage) throw new Error("Storage not available");
            const storageRef = ref(storage, resumePath);
            const downloadUrl = await getDownloadURL(storageRef);
            
            // This will open the URL in a new tab, which for most browsers and file types will trigger a download or display.
            window.open(downloadUrl, '_blank');

        } catch (error: any) {
            console.error("Error getting download URL:", error);
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: error.code === 'storage/object-not-found' 
                    ? 'The resume file could not be found.'
                    : error.message || 'Could not download the resume.',
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
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const jobDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'jobs', id);
  }, [firestore, id]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobDocRef);

  useEffect(() => {
    if (isUserLoading || isJobLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (job) {
      if (job.employerId === user.uid) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } else {
      // Job doesn't exist, so user is not authorized
      setIsAuthorized(false);
    }
  }, [isUserLoading, user, isJobLoading, job, router]);


  const applicantsQuery = useMemo(() => {
    if (!firestore || !id || !isAuthorized) return null; // Only query if authorized
    return query(collection(firestore, `jobs/${id}/applicants`), orderBy('appliedAt', 'desc'));
  }, [firestore, id, isAuthorized]);

  const { data: applicants, isLoading: areApplicantsLoading } = useCollection<JobApplicant>(applicantsQuery);

  const handleStatusChange = async (applicantId: string, newStatus: 'reviewed' | 'rejected' | 'hired') => {
    if (!firestore || !id || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to services.' });
        return;
    }
    
    try {
        const applicantDocRef = doc(firestore, 'jobs', id, 'applicants', applicantId);
        await updateDoc(applicantDocRef, { status: newStatus });
        toast({
            title: 'Status Updated',
            description: `Applicant status changed to ${newStatus}.`,
        });
    } catch (error: any) {
        console.error("Error updating application status:", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not update the application status.',
        });
    }
  };

  const isLoading = isUserLoading || isJobLoading || isAuthorized === null || (isAuthorized && areApplicantsLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
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
  
  if (!job) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-3xl font-bold">Job not found</h1>
        <Link href="/dashboard">
          <Button variant="link" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
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
                            <p className="text-sm text-muted-foreground">{applicant.seekerEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{format(applicant.appliedAt.toDate(), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={applicant.status === 'pending' ? 'secondary' : applicant.status === 'rejected' ? 'destructive' : applicant.status === 'reviewed' ? 'default' : 'default'}>
                        {applicant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DownloadResumeButton resumePath={applicant.resumeURL} />
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'reviewed')}>
                                    <Check className="mr-2 h-4 w-4" /> Mark as Reviewed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'hired')}>
                                    <Check className="mr-2 h-4 w-4" /> Mark as Hired
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'rejected')} className="text-red-600">
                                    <X className="mr-2 h-4 w-4" /> Reject
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
  );
}
