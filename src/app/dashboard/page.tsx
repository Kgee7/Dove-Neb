
'use client';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, where, deleteDoc } from '@/firebase';
import { doc, collection, query, orderBy, limit, updateDoc, getDocs } from 'firebase/firestore';
import { Loader2, PlusCircle, Home, BedDouble, Briefcase, Building2, Users, Edit, Trash2, Heart } from "lucide-react";
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
import { format } from 'date-fns';
import { Job } from '@/lib/job-data';
import { Room } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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

type ApplicantStatus = 'pending' | 'reviewed' | 'rejected' | 'hired';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [applicationToDelete, setApplicationToDelete] = useState<JobApplication | null>(null);

  const userDocRef = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

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
        // 1. Delete the application record from the user's subcollection
        const userApplicationRef = doc(firestore, 'users', user.uid, 'applications', id);
        await deleteDoc(userApplicationRef);
        
        // 2. Delete the application record from the job's subcollection
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


  const isLoading = isUserLoading || isProfileLoading || bookingsLoading || roomListingsLoading || applicationsLoading || jobListingsLoading || favoriteJobsLoading || favoriteRoomsLoading;

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const isEmployer = userProfile?.userType === 'employer';
  const isSeeker = userProfile?.userType === 'seeker';


  return (
    <>
    <div className="container py-10">
       <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Welcome, {userProfile?.firstName}!</h1>
          <p className="text-muted-foreground">Manage your jobs, rooms, and applications.</p>
        </div>
        <div className='flex gap-2'>
            <Link href="/dashboard/list-room">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    List a Space
                </Button>
            </Link>
            {isEmployer && (
                 <Link href="/dashboard/post-job">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Post a Job
                    </Button>
                </Link>
            )}
        </div>
      </div>
        <div className="grid gap-8">

            {/* My Favorites Section */}
            <Card>
                <CardHeader>
                    <CardTitle>My Favorites</CardTitle>
                    <CardDescription>Your saved jobs and spaces.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-8 md:grid-cols-2">
                        <div>
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5" />Favorite Jobs</h3>
                            {favoriteJobs && favoriteJobs.length > 0 ? (
                                <div className="space-y-4">
                                    {favoriteJobs.map(job => (
                                        <Link key={job.id} href={`/jobs/${job.jobId}`}>
                                        <div className="p-3 rounded-lg border hover:bg-muted cursor-pointer">
                                            <p className="font-medium">{job.title}</p>
                                            <p className="text-sm text-muted-foreground">{job.companyName} - {job.location}, {job.country}</p>
                                        </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No favorite jobs yet.</p>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><BedDouble className="h-5 w-5" />Favorite Spaces</h3>
                            {favoriteRooms && favoriteRooms.length > 0 ? (
                                <div className="space-y-4">
                                    {favoriteRooms.map(room => (
                                        <Link key={room.id} href={`/rooms/${room.roomId}`}>
                                        <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted cursor-pointer">
                                            <Image src={room.image} alt={room.title} width={64} height={64} className="rounded-md object-cover aspect-square" />
                                            <div>
                                                <p className="font-medium">{room.title}</p>
                                                <p className="text-sm text-muted-foreground">{room.location}, {room.country}</p>
                                            </div>
                                        </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No favorite spaces yet.</p>
                            )}
                        </div>
                    </div>
                     {(favoriteJobs?.length === 0 && favoriteRooms?.length === 0) && (
                         <div className='text-center py-12 border-2 border-dashed rounded-lg'>
                            <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">Nothing in your favorites yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Click the heart icon on any listing to save it here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>


            {/* Job Seeker View */}
            {isSeeker && (
                <Card>
                    <CardHeader>
                        <CardTitle>My Job Applications</CardTitle>
                        <CardDescription>Track your job applications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {applicationsLoading ? (
                            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                         ) : jobApplications && jobApplications.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {jobApplications.map(app => (
                                    <Card key={app.id}>
                                      <CardHeader>
                                        <CardTitle className="text-lg">{app.jobTitle}</CardTitle>
                                        <CardDescription>{app.companyName}</CardDescription>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-sm text-muted-foreground">Applied: {format(app.appliedAt.toDate(), 'MMM d, yyyy')}</p>
                                        {(() => {
                                            const status = app.status;
                                            const jobTitle = app.jobTitle;

                                            switch (status) {
                                                case 'hired':
                                                    return <p className="text-sm text-green-600 font-semibold mt-2">Congratulations, you have been hired as a {jobTitle}.</p>;
                                                case 'rejected':
                                                    return <p className="text-sm text-red-600 font-semibold mt-2">Sorry, your application for {jobTitle} has been rejected.</p>;
                                                case 'reviewed':
                                                    return <Badge className="mt-2 capitalize" variant="default">Under Review</Badge>;
                                                case 'pending':
                                                default:
                                                    if (app.applicationMethod === 'whatsapp') {
                                                        return <p className="text-sm text-muted-foreground mt-2">Check your WhatsApp for status updates.</p>;
                                                    }
                                                    if (app.applicationMethod === 'email') {
                                                        return <p className="text-sm text-muted-foreground mt-2">Check your email for status updates.</p>;
                                                    }
                                                    return <p className="text-sm text-muted-foreground mt-2">Check your email or WhatsApp for status updates.</p>;
                                            }
                                        })()}
                                        <div className='mt-4 flex gap-2'>
                                            <Link href={`/jobs/${app.jobId}`}>
                                                <Button variant="outline" size="sm">View Job</Button>
                                            </Link>
                                            <Button variant="destructive" size="sm" onClick={() => setApplicationToDelete(app)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Withdraw
                                            </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center py-12 border-2 border-dashed rounded-lg'>
                                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No job applications yet</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Start applying for jobs to see them here.</p>
                                <Link href="/jobs">
                                    <Button variant="outline" className="mt-4">Find Jobs</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Employer View */}
            {isEmployer && (
                 <Card>
                    <CardHeader>
                        <CardTitle>My Job Listings</CardTitle>
                        <CardDescription>Manage your posted jobs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {jobListings && jobListings.length > 0 ? (
                             <div className="grid gap-6 md:grid-cols-2">
                                {jobListings.map(job => (
                                     <Card key={job.id}>
                                      <CardHeader>
                                        <CardTitle className="text-lg">{job.title}</CardTitle>
                                        <CardDescription>{job.location}, {job.country}</CardDescription>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                          <Link href={`/jobs/${job.id}`}>
                                              <Button variant="outline" size="sm">View Listing</Button>
                                          </Link>
                                           <Link href={`/dashboard/jobs/${job.id}/applicants`}>
                                              <Button size="sm">
                                                <Users className="mr-2 h-4 w-4"/>
                                                View Applicants
                                              </Button>
                                          </Link>
                                          <Link href={`/dashboard/jobs/${job.id}/edit`}>
                                            <Button variant="secondary" size="sm">
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                          </Link>
                                          <Button variant="destructive" size="sm" onClick={() => setJobToDelete(job.id)}>
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center py-12 border-2 border-dashed rounded-lg'>
                                <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No jobs posted yet.</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Post a job to find the best candidates.</p>
                                <Link href="/dashboard/post-job">
                                    <Button className="mt-4">Post a Job</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Room Bookings View */}
            <Card>
                <CardHeader>
                    <CardTitle>My Bookings</CardTitle>
                    <CardDescription>View your upcoming and past stays.</CardDescription>
                </CardHeader>
                <CardContent>
                    {bookings && bookings.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            {bookings.map(booking => (
                                <Card key={booking.id} className="overflow-hidden">
                                    <div className="flex">
                                        <div className="relative w-1/3 aspect-square">
                                           <Image src={booking.roomImage} alt={booking.roomTitle} fill className="object-cover" />
                                        </div>
                                        <div className='p-4 flex-1'>
                                            <h3 className="font-semibold">{booking.roomTitle}</h3>
                                            <p className="text-sm text-muted-foreground">{booking.roomLocation}</p>
                                            <p className="text-sm mt-2">
                                                {format(booking.checkInDate.toDate(), 'MMM d, yyyy')} - {format(booking.checkOutDate.toDate(), 'MMM d, yyyy')}
                                            </p>
                                            <p className="text-sm font-semibold mt-1">Total: ${booking.totalPrice}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className='text-center py-12 border-2 border-dashed rounded-lg'>
                            <BedDouble className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No bookings yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Start exploring and book your next stay!</p>
                            <Link href="/rooms">
                                <Button variant="outline" className="mt-4">Explore Rooms</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
             
            {/* Room Listings View (For Owners) */}
            <Card>
                <CardHeader>
                    <CardTitle>My Space Listings</CardTitle>
                    <CardDescription>Manage the spaces you are hosting.</CardDescription>
                </CardHeader>
                <CardContent>
                    {roomListings && roomListings.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            {roomListings.map(listing => (
                                 <Card key={listing.id}>
                                    <div className="flex">
                                        <div className="relative w-1.3 aspect-video">
                                            <Image src={listing.images[0]} alt={listing.title} fill className="object-cover rounded-l-lg" />
                                        </div>
                                        <div className='p-4 flex-1'>
                                            <h3 className="font-semibold">{listing.title}</h3>
                                            <p className="text-sm text-muted-foreground">{listing.location}, {listing.country}</p>
                                            <p className="text-sm mt-2 font-semibold">
                                                {listing.listingType === 'sale' && listing.salePrice ? `${listing.currencySymbol}${listing.salePrice.toLocaleString()}` : ''}
                                                {listing.listingType === 'rent' && listing.priceNight ? `${listing.currencySymbol}${listing.priceNight}/night` : ''}
                                                {listing.listingType === 'rent' && listing.priceMonth ? ` | ${listing.currencySymbol}${listing.priceMonth}/month` : ''}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <Link href={`/rooms/${listing.id}`}>
                                                    <Button variant="outline" size="sm">View</Button>
                                                </Link>
                                                <Link href={`/dashboard/rooms/${listing.id}/edit`}>
                                                    <Button variant="secondary" size="sm"><Edit className="mr-2 h-4 w-4" />Edit</Button>
                                                </Link>
                                                <Button variant="destructive" size="sm" onClick={() => setRoomToDelete(listing.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                       <div className='text-center py-12 border-2 border-dashed rounded-lg'>
                            <Home className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">You have no active listings.</h3>
                            <p className="mt-1 text-sm text-muted-foreground">List your space to start earning.</p>
                            <Link href="/dashboard/list-room">
                                <Button variant="default" className="mt-4">List a Space</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
    <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this job listing and all associated applicant data.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteJob}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this room listing from the platform.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRoom}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
     <AlertDialog open={!!applicationToDelete} onOpenChange={(open) => !open && setApplicationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will withdraw your application. The employer will no longer be able to see it.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleWithdrawApplication}>Withdraw</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
