
'use client';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, where, deleteDoc } from '@/firebase';
import { doc, collection, query, orderBy, limit, updateDoc, setDoc } from 'firebase/firestore';
import { Loader2, PlusCircle, Home, BedDouble, Briefcase, Building2, Users, Edit, Trash2, Heart, Bell, HelpCircle, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { format, differenceInDays, parseISO, addHours, isAfter } from 'date-fns';
import { Job } from '@/lib/job-data';
import { Room } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Notification } from '@/components/notifications-dropdown';
import { cn } from '@/lib/utils';
import { incrementRoomRating } from '@/app/rooms/[id]/room-actions';
import { v4 as uuidv4 } from 'uuid';

type UserProfile = {
  userType: 'seeker' | 'employer' | 'renter' | 'owner';
  firstName: string;
  lastName: string;
};

type Booking = {
    id: string;
    roomTitle: string;
    roomLocation: string;
    roomImage: string;
    checkInDate: { toDate: () => Date };
    checkOutDate: { toDate: () => Date };
    totalPrice: number;
    currencySymbol?: string;
}

type JobApplication = {
    id: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    status: 'pending' | 'reviewed' | 'rejected' | 'hired';
    appliedAt: { toDate: () => Date };
    applicantDocId?: string;
    applicationMethod?: 'email' | 'whatsapp';
    applicationContact?: string;
}

type FavoriteJob = {
    id: string;
    jobId: string;
    title: string;
    companyName: string;
    location: string;
    country: string;
}

type FavoriteRoom = {
    id: string;
    roomId: string;
    title: string;
    location: string;
    country: string;
    image: string;
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [applicationToDelete, setApplicationToDelete] = useState<JobApplication | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  const userDocRef = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  // Notifications
  const notificationsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore, user?.uid]);
  const { data: notifications, isLoading: notificationsLoading } = useCollection<Notification>(notificationsQuery);

  // Queries for Room related data
  const bookingsQuery = useMemo(() => {
      if (!firestore || !user?.uid) return null;
      return query(collection(firestore, 'users', user.uid, 'bookings'), orderBy('checkInDate', 'desc'));
  }, [firestore, user?.uid]);
  const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);

  const roomListingsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'rooms'), where('ownerId', '==', user.uid));
  }, [firestore, user?.uid]);
  const { data: roomListings, isLoading: roomListingsLoading } = useCollection<Room>(roomListingsQuery);

  // Queries for Job related data
  const jobApplicationsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'applications'), orderBy('appliedAt', 'desc'));
  }, [firestore, user?.uid]);
  const { data: jobApplications, isLoading: applicationsLoading } = useCollection<JobApplication>(jobApplicationsQuery);

  const jobListingsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'jobs'), where('employerId', '==', user.uid));
  }, [firestore, user?.uid]);
  const { data: jobListings, isLoading: jobListingsLoading } = useCollection<Job>(jobListingsQuery);

  // Queries for Favorites
  const favoriteJobsQuery = useMemo(() => {
      if (!firestore || !user?.uid) return null;
      return query(collection(firestore, 'users', user.uid, 'favoriteJobs'), orderBy('addedAt', 'desc'));
  }, [firestore, user?.uid]);
  const { data: favoriteJobs, isLoading: favoriteJobsLoading } = useCollection<FavoriteJob>(favoriteJobsQuery);

  const favoriteRoomsQuery = useMemo(() => {
      if (!firestore || !user?.uid) return null;
      return query(collection(firestore, 'users', user.uid, 'favoriteRooms'), orderBy('addedAt', 'desc'));
  }, [firestore, user?.uid]);
  const { data: favoriteRooms, isLoading: favoriteRoomsLoading } = useCollection<FavoriteRoom>(favoriteRoomsQuery);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Expiry Checker logic
  useEffect(() => {
    if (!user || !firestore || isProfileLoading || notificationsLoading || (jobListingsLoading && roomListingsLoading)) return;

    const checkExpiries = async () => {
        const today = new Date();
        const listingsToCheck: { id: string, title: string, endDate: string, type: 'job' | 'room' }[] = [];

        jobListings?.forEach(job => {
            if (job.status === 'active' && job.listingEndDate) {
                listingsToCheck.push({ id: job.id, title: job.title, endDate: job.listingEndDate, type: 'job' });
            }
        });

        roomListings?.forEach(room => {
            if (room.status === 'active' && room.listingType === 'sale' && room.listingEndDate) {
                listingsToCheck.push({ id: room.id, title: room.title, endDate: room.listingEndDate, type: 'room' });
            }
        });

        for (const listing of listingsToCheck) {
            const endDate = parseISO(listing.endDate);
            const daysLeft = differenceInDays(endDate, today);

            if (daysLeft < 0) {
                const docRef = doc(firestore, listing.type === 'job' ? 'jobs' : 'rooms', listing.id);
                updateDoc(docRef, { status: 'archived' });
                continue;
            }

            if (daysLeft <= 3) {
                const alreadyNotified = notifications?.find(n => n.relatedListingId === listing.id && n.type === 'expiry_check');
                if (!alreadyNotified) {
                    const message = listing.type === 'job' 
                        ? `"${listing.title}" will expire on ${listing.endDate}. Have you hired a worker for this position?`
                        : `"${listing.title}" will expire on ${listing.endDate}. Have you sold this apartment?`;

                    const notifId = uuidv4();
                    setDoc(doc(firestore, 'users', user.uid, 'notifications', notifId), {
                        id: notifId,
                        title: listing.title,
                        message,
                        type: 'expiry_check',
                        surveyQuestion: message,
                        surveyAnswer: null,
                        relatedListingId: listing.id,
                        relatedListingType: listing.type,
                        read: false,
                        createdAt: new Date()
                    });
                }
            }

            // 3-day "Still hiring?" check for jobs (triggered 3 days after the most recent application)
            if (listing.type === 'job') {
                const jobListing = jobListings?.find(j => j.id === listing.id);
                if (jobListing) {
                    // Use lastApplicantAt if available, otherwise fallback to createdAt
                    const anchorDateRaw = jobListing.lastApplicantAt || jobListing.createdAt;
                    if (anchorDateRaw) {
                        const anchorDate = typeof anchorDateRaw === 'string' ? parseISO(anchorDateRaw) : (anchorDateRaw as any).toDate ? (anchorDateRaw as any).toDate() : new Date(anchorDateRaw);
                        const daysSinceTrigger = differenceInDays(today, anchorDate);
                        
                        if (daysSinceTrigger >= 3) {
                            const alreadyReminded = notifications?.find(n => n.relatedListingId === listing.id && n.type === 'hiring_check');
                            if (!alreadyReminded) {
                                // If it's based on an application, the message is slightly different
                                const message = jobListing.lastApplicantAt 
                                    ? `It's been 3 days since you received an application for "${listing.title}". Have you found a worker for this position?`
                                    : `It's been 3 days since you posted "${listing.title}". Have you found a worker for this position?`;
                                    
                                const notifId = uuidv4();
                                setDoc(doc(firestore, 'users', user.uid, 'notifications', notifId), {
                                    id: notifId,
                                    title: 'Hiring Update',
                                    message,
                                    type: 'hiring_check',
                                    surveyQuestion: message,
                                    surveyAnswer: null,
                                    relatedListingId: listing.id,
                                    relatedListingType: 'job',
                                    read: false,
                                    createdAt: new Date()
                                });
                            }
                        }
                    }
                }
            }
        }

        const pendingRemovals = [
            ...(jobListings?.filter(j => j.status === 'pending_removal') || []).map(j => ({ ...j, type: 'job' })),
            ...(roomListings?.filter(r => r.status === 'pending_removal') || []).map(r => ({ ...r, type: 'room' }))
        ];

        for (const item of pendingRemovals) {
            if (item.removalDate) {
                const rDate = item.removalDate.toDate ? item.removalDate.toDate() : new Date(item.removalDate);
                if (isAfter(new Date(), rDate)) {
                    const docRef = doc(firestore, (item as any).type === 'job' ? 'jobs' : 'rooms', item.id);
                    updateDoc(docRef, { status: 'archived' });
                }
            }
        }
    };

    checkExpiries();
  }, [user, firestore, jobListings, roomListings, notifications, isProfileLoading, notificationsLoading, jobListingsLoading, roomListingsLoading]);
  
  const handleSurveyAnswer = async (notifId: string, answer: 'yes' | 'no', roomId?: string) => {
    if (!firestore || !user) return;
    try {
        const notif = notifications?.find(n => n.id === notifId);
        
        await updateDoc(doc(firestore, 'users', user.uid, 'notifications', notifId), {
            surveyAnswer: answer,
            read: true,
            message: `Survey complete: You answered "${answer}".`
        });

        if ((notif?.type === 'expiry_check' || notif?.type === 'hiring_check') && answer === 'yes' && notif.relatedListingId) {
            const collectionName = (notif as any).relatedListingType === 'job' ? 'jobs' : 'rooms';
            const listingRef = doc(firestore, collectionName, notif.relatedListingId);
            
            const removalDate = addHours(new Date(), 24);
            await updateDoc(listingRef, { 
                status: 'pending_removal',
                removalDate: removalDate
            });

            const followUpId = uuidv4();
            await setDoc(doc(firestore, 'users', user.uid, 'notifications', followUpId), {
                id: followUpId,
                title: notif.title,
                message: `"${notif.title}" will automatically be removed from public view within 24 hours.`,
                type: 'info',
                read: false,
                createdAt: new Date()
            });

            toast({ title: 'Listing Scheduled', description: 'Your listing will be removed from public view within 24 hours.' });
        } else if (answer === 'yes' && roomId) {
            const result = await incrementRoomRating(roomId);
            if (result.success) {
                toast({ title: 'Feedback Recorded', description: 'Thank you! Your positive feedback has improved this space\'s rating.' });
            } else {
                toast({ title: 'Saved', description: 'Thank you for your response!' });
            }
        } else {
            toast({ title: 'Feedback Recorded', description: 'Thank you for your response!' });
        }
    } catch (error) {
        console.error(error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!firestore || !user) return;
    updateDoc(doc(firestore, 'users', user.uid, 'notifications', id), { read: true });
  };

  const handleDeleteNotification = async (id: string) => {
    if (!firestore || !user) return;
    deleteDoc(doc(firestore, 'users', user.uid, 'notifications', id));
  };

  const handleDeleteJob = async () => {
    if (!firestore || !jobToDelete) return;
    try {
        const jobRef = doc(firestore, 'jobs', jobToDelete);
        await deleteDoc(jobRef);
        toast({
            title: 'Job Deleted',
            description: 'The job listing has been successfully removed.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: error.message || 'Could not delete the job listing.',
        });
    } finally {
        setJobToDelete(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!firestore || !roomToDelete) return;
    try {
        const roomRef = doc(firestore, 'rooms', roomToDelete);
        await deleteDoc(roomRef);
        toast({
            title: 'Room Deleted',
            description: 'The room listing has been successfully removed.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: error.message || 'Could not delete the room listing.',
        });
    } finally {
        setRoomToDelete(null);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!firestore || !user || !applicationToDelete) return;
    const { id, jobId, applicantDocId } = applicationToDelete;
    
    try {
        const userApplicationRef = doc(firestore, 'users', user.uid, 'applications', id);
        await deleteDoc(userApplicationRef);
        
        if (jobId && applicantDocId) {
            const jobApplicantRef = doc(firestore, 'jobs', jobId, 'applicants', applicantDocId);
            await deleteDoc(jobApplicantRef);
        }

        toast({
            title: 'Application Withdrawn',
            description: 'Your application has been successfully withdrawn.',
        });
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Withdrawal Failed',
            description: error.message || 'Could not withdraw your application.',
        });
    } finally {
        setApplicationToDelete(null);
    }
  };

  const handleDeleteBooking = async () => {
    if (!firestore || !user || !bookingToDelete) return;
    try {
        const bookingRef = doc(firestore, 'users', user.uid, 'bookings', bookingToDelete.id);
        await deleteDoc(bookingRef);
        toast({
            title: 'Booking Removed',
            description: 'The booking record has been removed from your history.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: error.message || 'Could not remove the booking record.',
        });
    } finally {
        setBookingToDelete(null);
    }
  };


  const isLoading = isUserLoading || isProfileLoading || bookingsLoading || roomListingsLoading || applicationsLoading || jobListingsLoading || favoriteJobsLoading || favoriteRoomsLoading || notificationsLoading;

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const isEmployer = userProfile?.userType === 'employer';
  const isSeeker = userProfile?.userType === 'seeker' || !userProfile?.userType;


  return (
    <>
    <div className="container py-6 sm:py-10 px-4">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline transition-all">Welcome, {userProfile?.firstName}!</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your jobs, Lodge Now, and applications.</p>
        </div>
        <div className='flex flex-wrap gap-2'>
            <Link href="/dashboard/list-room" className="flex-1 sm:flex-none">
                <Button className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    List Room
                </Button>
            </Link>
            {isEmployer && (
                 <Link href="/dashboard/post-job" className="flex-1 sm:flex-none">
                    <Button className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Post Job
                    </Button>
                </Link>
            )}
        </div>
      </div>
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                {/* My Favorites Section */}
                <Card>
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                        <CardTitle className="text-xl">My Favorites</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Your saved jobs and Lodge Now.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
                            <div>
                                <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2"><Briefcase className="h-4 w-4" />Favorite Jobs</h3>
                                {favoriteJobs && favoriteJobs.length > 0 ? (
                                    <div className="space-y-3">
                                        {favoriteJobs.map(job => (
                                            <Link key={job.id} href={`/jobs/${job.jobId}`}>
                                            <div className="p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors">
                                                <p className="font-medium text-xs sm:text-sm truncate">{job.title}</p>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{job.companyName} • {job.location}</p>
                                            </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">No favorite jobs yet.</p>
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2"><BedDouble className="h-4 w-4" />Favorite Lodge Now</h3>
                                {favoriteRooms && favoriteRooms.length > 0 ? (
                                    <div className="space-y-3">
                                        {favoriteRooms.map(room => (
                                            <Link key={room.id} href={`/rooms/${room.roomId}`}>
                                            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors">
                                                <Image src={room.image} alt={room.title} width={48} height={48} className="rounded-md object-cover aspect-square shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-xs sm:text-sm truncate">{room.title}</p>
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{room.location}, {room.country}</p>
                                                </div>
                                            </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">No favorite Lodge Now yet.</p>
                                )}
                            </div>
                        </div>
                        {(favoriteJobs?.length === 0 && favoriteRooms?.length === 0) && (
                            <div className='text-center py-10 border-2 border-dashed rounded-lg mt-4'>
                                <Heart className="mx-auto h-10 w-10 text-muted-foreground/30" />
                                <h3 className="mt-2 text-sm font-medium">Nothing here yet</h3>
                                <p className="text-[10px] sm:text-xs text-muted-foreground px-4">Click the heart icon on any listing to save it.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>


                {/* Job Seeker View */}
                {isSeeker && (
                    <Card>
                        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                            <CardTitle className="text-xl">My Job Applications</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Track your progress.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {applicationsLoading ? (
                                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : jobApplications && jobApplications.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {jobApplications.map(app => (
                                        <Card key={app.id} className="overflow-hidden border-muted/60">
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-sm sm:text-base line-clamp-1">{app.jobTitle}</CardTitle>
                                            <CardDescription className="text-[10px] sm:text-xs truncate">{app.companyName}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <p className="text-[10px] text-muted-foreground">Applied: {format(app.appliedAt.toDate(), 'MMM d, yyyy')}</p>
                                            <div className="mt-2">
                                                {(() => {
                                                    const status = app.status;
                                                    switch (status) {
                                                        case 'hired':
                                                            return <p className="text-[10px] sm:text-xs text-green-600 font-semibold">Congratulations! You're hired.</p>;
                                                        case 'rejected':
                                                            return <p className="text-[10px] sm:text-xs text-red-600 font-semibold">Application rejected.</p>;
                                                        case 'reviewed':
                                                            return <Badge className="text-[8px] py-0 px-1.5 h-4 capitalize" variant="default">Under Review</Badge>;
                                                        case 'pending':
                                                        default:
                                                            return <Badge variant="outline" className="text-[8px] py-0 px-1.5 h-4">Pending</Badge>;
                                                    }
                                                })()}
                                            </div>
                                            <div className='mt-4 flex gap-2'>
                                                <Link href={`/jobs/${app.jobId}`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full h-8 text-[10px]">View Job</Button>
                                                </Link>
                                                <Button variant="destructive" size="sm" className="h-8 text-[10px]" onClick={() => setApplicationToDelete(app)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className='text-center py-12 border-2 border-dashed rounded-lg'>
                                    <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/30" />
                                    <h3 className="mt-2 text-sm font-medium">No applications yet</h3>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-4">Start applying to see updates here.</p>
                                    <Link href="/jobs">
                                        <Button variant="outline" size="sm">Find Jobs</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Employer View */}
                {isEmployer && (
                    <Card>
                        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                            <CardTitle className="text-xl">My Job Listings</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Manage your open roles.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {jobListings && jobListings.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {jobListings.map(job => (
                                        <Card key={job.id} className={cn("border-muted/60", job.status !== 'active' && "opacity-60 bg-muted/20")}>
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-sm sm:text-base truncate">{job.title}</CardTitle>
                                                {job.status !== 'active' && <Badge variant="secondary" className="text-[8px] px-1 h-4">{job.status === 'pending_removal' ? 'Removing' : 'Expired'}</Badge>}
                                            </div>
                                            <CardDescription className="text-[10px] sm:text-xs">{job.location}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                            <Link href={`/jobs/${job.id}`}>
                                                <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">View</Button>
                                            </Link>
                                            <Link href={`/dashboard/jobs/${job.id}/applicants`}>
                                                <Button size="sm" className="h-7 text-[10px] px-2">
                                                    Applicants
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/jobs/${job.id}/edit`}>
                                                <Button variant="secondary" size="sm" className="h-7 text-[10px] px-2">
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Button variant="destructive" size="sm" className="h-7 text-[10px] px-2" onClick={() => setJobToDelete(job.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                            </div>
                                        </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className='text-center py-12 border-2 border-dashed rounded-lg'>
                                    <Building2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
                                    <h3 className="mt-2 text-sm font-medium">No active listings</h3>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-4">Post a role to find candidates.</p>
                                    <Link href="/dashboard/post-job">
                                        <Button size="sm">Post a Job</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Room Bookings View */}
                <Card>
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                        <CardTitle className="text-xl">My Bookings</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Manage your stay history.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        {bookings && bookings.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {bookings.map(booking => (
                                    <Card key={booking.id} className="overflow-hidden border-muted/60">
                                        <div className="flex h-24 sm:h-28">
                                            <div className="relative w-24 sm:w-32 shrink-0">
                                            <Image src={booking.roomImage} alt={booking.roomTitle} fill className="object-cover" />
                                            </div>
                                            <div className='p-3 flex-1 flex flex-col min-w-0'>
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="min-w-0">
                                                        <h3 className="font-semibold text-xs sm:text-sm truncate">{booking.roomTitle}</h3>
                                                        <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{booking.roomLocation}</p>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" 
                                                        onClick={() => setBookingToDelete(booking)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                                <div className="mt-auto flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[8px] sm:text-[9px] text-muted-foreground">
                                                            {format(booking.checkInDate.toDate(), 'MMM d')} - {format(booking.checkOutDate.toDate(), 'MMM d')}
                                                        </p>
                                                        <p className="text-xs font-bold text-primary">{booking.currencySymbol || '$'}{booking.totalPrice}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-[8px] h-4 px-1">Active</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center py-12 border-2 border-dashed rounded-lg'>
                                <BedDouble className="mx-auto h-10 w-10 text-muted-foreground/30" />
                                <h3 className="mt-2 text-sm font-medium">No bookings yet</h3>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mb-4">Discover your next stay.</p>
                                <Link href="/rooms">
                                    <Button variant="outline" size="sm">Explore Lodge Now</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* Room Listings View (For Owners) */}
                <Card>
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                        <CardTitle className="text-xl">My Hosted Spaces</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Manage your properties.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        {roomListings && roomListings.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {roomListings.map(listing => (
                                    <Card key={listing.id} className={cn("overflow-hidden border-muted/60", listing.status !== 'active' && "opacity-60 bg-muted/20")}>
                                        <div className="flex h-24 sm:h-28">
                                            <div className="relative w-24 sm:w-32 shrink-0">
                                                <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                                            </div>
                                            <div className='p-3 flex-1 flex flex-col min-w-0'>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold text-xs sm:text-sm truncate">{listing.title}</h3>
                                                    {listing.status !== 'active' && <Badge variant="secondary" className="text-[8px] px-1 h-4">{listing.status === 'pending_removal' ? 'Removing' : 'Expired'}</Badge>}
                                                </div>
                                                <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{listing.location}</p>
                                                <p className="text-xs font-bold mt-1 text-primary">
                                                    {listing.listingType === 'sale' && listing.salePrice ? `${listing.currencySymbol}${listing.salePrice.toLocaleString()}` : ''}
                                                    {listing.listingType === 'rent' && listing.priceNight ? `${listing.currencySymbol}${listing.priceNight}/night` : ''}
                                                </p>
                                                <div className="flex gap-1.5 mt-auto">
                                                    <Link href={`/rooms/${listing.id}`}>
                                                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">View</Button>
                                                    </Link>
                                                    <Link href={`/dashboard/rooms/${listing.id}/edit`}>
                                                        <Button variant="secondary" size="sm" className="h-7 text-[10px] px-2"><Edit className="h-3 w-3" /></Button>
                                                    </Link>
                                                    <Button variant="destructive" size="sm" className="h-7 text-[10px] px-2" onClick={() => setRoomToDelete(listing.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                        <div className='text-center py-12 border-2 border-dashed rounded-lg'>
                                <Home className="mx-auto h-10 w-10 text-muted-foreground/30" />
                                <h3 className="mt-2 text-sm font-medium">No properties listed</h3>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mb-4">List your space to start hosting.</p>
                                <Link href="/dashboard/list-room">
                                    <Button size="sm">List a Space</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Notifications Sidebar */}
            <div className="lg:col-span-1">
                <Card className="sticky top-20 border-primary/20 shadow-lg">
                    <CardHeader className="p-4 sm:p-6 pb-2 border-b bg-primary/[0.02]">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" />
                                Notifications
                            </CardTitle>
                            {notifications && notifications.filter(n => !n.read).length > 0 && (
                                <Badge className="text-[10px] px-1.5 h-5">{notifications.filter(n => !n.read).length} new</Badge>
                            )}
                        </div>
                        <CardDescription className="text-xs">Your activity and updates</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {notifications && notifications.length > 0 ? (
                            <div className="divide-y max-h-[calc(100vh-320px)] overflow-y-auto">
                                {notifications.map(notif => (
                                    <div key={notif.id} className={cn("p-4 space-y-2 group transition-colors", !notif.read && "bg-primary/[0.04]")}>
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {notif.type === 'survey' || notif.type === 'expiry_check' || notif.type === 'hiring_check' ? <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0" /> : <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                                <h4 className="font-bold text-[11px] sm:text-xs truncate">{notif.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {!notif.read && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/10" onClick={() => handleMarkAsRead(notif.id)}>
                                                        <Check className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteNotification(notif.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-muted-foreground">{notif.message}</p>
                                        
                                        {(notif.type === 'survey' || notif.type === 'expiry_check' || notif.type === 'hiring_check') && !notif.surveyAnswer && (
                                            <div className="flex gap-2 pt-1">
                                                <Button size="sm" className="h-7 px-3 text-[10px] flex-1 bg-primary font-bold" onClick={() => handleSurveyAnswer(notif.id, 'yes', notif.roomId)}>
                                                    Yes
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 px-3 text-[10px] flex-1 font-bold" onClick={() => handleSurveyAnswer(notif.id, 'no')}>
                                                    No
                                                </Button>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-[9px] text-muted-foreground uppercase font-medium">
                                                {format(notif.createdAt.toDate(), 'MMM d, h:mm a')}
                                            </span>
                                            {!notif.read && <div className="h-1.5 w-1.5 bg-primary rounded-full" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                <p className="text-xs text-muted-foreground">No recent activity.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
    <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent className="w-[90%] max-w-md rounded-lg">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-lg">Delete listing?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                    This will permanently delete this job listing and all associated applicant data.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="h-9 sm:h-10">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteJob} className="h-9 sm:h-10 bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
        <AlertDialogContent className="w-[90%] max-w-md rounded-lg">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-lg">Delete room?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                    This will permanently delete this room listing from the platform.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="h-9 sm:h-10">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRoom} className="h-9 sm:h-10 bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
     <AlertDialog open={!!applicationToDelete} onOpenChange={(open) => !open && setApplicationToDelete(null)}>
        <AlertDialogContent className="w-[90%] max-w-md rounded-lg">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-lg">Withdraw application?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                    The employer will no longer be able to see your interest in this role.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="h-9 sm:h-10">No, stay</AlertDialogCancel>
                <AlertDialogAction onClick={handleWithdrawApplication} className="h-9 sm:h-10 bg-destructive hover:bg-destructive/90">Withdraw</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={!!bookingToDelete} onOpenChange={(open) => !open && setBookingToDelete(null)}>
        <AlertDialogContent className="w-[90%] max-w-md rounded-lg">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-lg">Remove booking?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                    This will remove the record from your history.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="h-9 sm:h-10">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteBooking} className="h-9 sm:h-10 bg-destructive text-white hover:bg-destructive/90">Remove</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
