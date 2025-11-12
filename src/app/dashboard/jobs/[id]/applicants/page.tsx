
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { useDoc, useCollection, useFirestore, useUser, useFunctions } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Job, JobApplicant } from '@/lib/job-data';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Mail, Download, User, Check, X, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

export default function JobApplicantsPage() {
  const functions = useFunctions();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if user is not loaded and not present
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const jobDocRef = useMemo(() => {
    // Wait until user is loaded and exists before creating the ref
    if (!firestore || !id || isUserLoading || !user) return null;
    return doc(firestore, 'jobs', id);
  }, [firestore, id, isUserLoading, user]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobDocRef);

  const applicantsQuery = useMemo(() => {
    // Wait until user is loaded and exists before creating the query
    if (!firestore || !id || isUserLoading || !user) return null;
    return query(collection(firestore, `jobs/${id}/applicants`), orderBy('appliedAt', 'desc'));
  }, [firestore, id, isUserLoading, user]);

  const { data: applicants, isLoading: areApplicantsLoading } = useCollection<JobApplicant>(applicantsQuery);

  const handleStatusChange = async (applicantId: string, newStatus: 'reviewed' | 'rejected' | 'hired') => {
    if (!functions || !id || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to services.' });
        return;
    }

    const applicant = applicants?.find(a => a.id === applicantId);
    if (!applicant) {
        toast({ variant: 'destructive', title: 'Error', description: 'Applicant not found.' });
        return;
    }

    try {
      const updateStatusFunction = httpsCallable(functions, 'updateApplicationStatus');
      await updateStatusFunction({
        jobId: id,
        applicantId: applicant.id,
        seekerId: applicant.seekerId,
        newStatus: newStatus,
      });

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


  const isLoading = isUserLoading || isJobLoading || areApplicantsLoading;

  if (isLoading || !user) {
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
        <Link href="/dashboard">
          <Button variant="link" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  if (job.employerId !== user?.uid) {
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
  
  const getResumeFileName = (resumeURL: string | undefined): string => {
    if (!resumeURL) return 'resume.txt';
    try {
      const mimeType = resumeURL.substring(resumeURL.indexOf(':') + 1, resumeURL.indexOf(';'));
      if (mimeType === 'application/pdf') return 'resume.pdf';
      if (mimeType === 'application/msword') return 'resume.doc';
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'resume.docx';
    } catch (e) {
      // Fallback for unexpected formats
    }
    return 'resume.txt';
  };


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
                      <Badge variant={applicant.status === 'pending' ? 'secondary' : applicant.status === 'rejected' ? 'destructive' : 'default'}>
                        {applicant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {applicant.resumeURL && (
                            <a 
                                href={applicant.resumeURL} 
                                download={getResumeFileName(applicant.resumeURL)}
                            >
                                <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Resume</Button>
                            </a>
                        )}
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
