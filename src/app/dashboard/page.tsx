'use client';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, where } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Loader2, PlusCircle, Home, BedDouble, Briefcase, Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Job } from '@/lib/job-data';
import { Badge } from '@/components/ui/badge';

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

type Room = {
    id: string;
    title: string;
    location: string;
    images: string[];
    price: number;
    currencySymbol: string;
}

type JobApplication = {
    id: string;
    jobTitle: string;
    companyName: string;
    status: string;
    appliedAt: { toDate: () => Date };
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  // Queries for Room related data
  const bookingsQuery = useMemo(() => {
      if (!firestore || !user?.uid) return null;
      return query(collection(firestore, 'users', user.uid, 'bookings'), orderBy('checkInDate', 'desc'));
  }, [firestore, user]);
  const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);

  const roomListingsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'rooms'), where('ownerId', '==', user.uid));
  }, [firestore, user]);
  const { data: roomListings, isLoading: roomListingsLoading } = useCollection<Room>(roomListingsQuery);

  // Queries for Job related data
  const jobApplicationsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'applications'), orderBy('appliedAt', 'desc'));
  }, [firestore, user]);
  const { data: jobApplications, isLoading: applicationsLoading } = useCollection<JobApplication>(jobApplicationsQuery);

  const jobListingsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'jobs'), where('employerId', '==', user.uid));
  }, [firestore, user]);
  const { data: jobListings, isLoading: jobListingsLoading } = useCollection<Job>(jobListingsQuery);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const isLoading = isUserLoading || isProfileLoading || bookingsLoading || roomListingsLoading || applicationsLoading || jobListingsLoading;

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
                    List a Room
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
            {/* Job Seeker View */}
            {isSeeker && (
                <Card>
                    <CardHeader>
                        <CardTitle>My Job Applications</CardTitle>
                        <CardDescription>Track your job applications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {jobApplications && jobApplications.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {jobApplications.map(app => (
                                    <Card key={app.id}>
                                      <CardHeader>
                                        <CardTitle className="text-lg">{app.jobTitle}</CardTitle>
                                        <CardDescription>{app.companyName}</CardDescription>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-sm text-muted-foreground">Applied: {format(app.appliedAt.toDate(), 'MMM d, yyyy')}</p>
                                        <Badge className="mt-2" variant={app.status === 'pending' ? 'secondary' : 'default'}>{app.status}</Badge>
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
                                        <CardDescription>{job.location}</CardDescription>
                                      </CardHeader>
                                      <CardContent>
                                        <Link href={`/jobs/${job.id}`}>
                                            <Button variant="outline" size="sm">View Listing</Button>
                                        </Link>
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
                    <CardTitle>My Room Listings</CardTitle>
                    <CardDescription>Manage the rooms you are hosting.</CardDescription>
                </CardHeader>
                <CardContent>
                    {roomListings && roomListings.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            {roomListings.map(listing => (
                                 <Card key={listing.id} className="overflow-hidden">
                                    <div className="flex">
                                        <div className="relative w-1/3 aspect-square">
                                            <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                                        </div>
                                        <div className='p-4 flex-1'>
                                            <h3 className="font-semibold">{listing.title}</h3>
                                            <p className="text-sm text-muted-foreground">{listing.location}</p>
                                            <p className="text-sm mt-2 font-semibold">{listing.currencySymbol}{listing.price}/night</p>
                                            <Link href={`/rooms/${listing.id}`} className="mt-2">
                                                <Button variant="outline" size="sm">View Listing</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                       <div className='text-center py-12 border-2 border-dashed rounded-lg'>
                            <Home className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">You have no active room listings.</h3>
                            <p className="mt-1 text-sm text-muted-foreground">List your space to start earning.</p>
                            <Link href="/dashboard/list-room">
                                <Button variant="default" className="mt-4">List a Room</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
