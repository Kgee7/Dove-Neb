
'use client';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

type UserProfile = {
  userType: 'renter' | 'owner';
  firstName: string;
  lastName: string;
};

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isProfileLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
       <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Welcome, {userProfile?.firstName}!</h1>
          <p className="text-muted-foreground">Manage your listings and bookings.</p>
        </div>
        {userProfile?.userType === 'owner' && (
             <Link href="/dashboard/list-room">
                <Button className="bg-accent hover:bg-accent/90">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    List a New Room
                </Button>
            </Link>
        )}
      </div>
        <div className="grid gap-6 md:grid-cols-2">
             <Card>
                <CardHeader>
                    <CardTitle>My Bookings</CardTitle>
                    <CardDescription>View your upcoming and past stays.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className='text-sm text-muted-foreground text-center py-8'>You have no bookings yet.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>My Listings</CardTitle>
                    <CardDescription>Manage the rooms you are hosting.</CardDescription>
                </CardHeader>
                <CardContent>
                     {userProfile?.userType === 'owner' ? (
                        <p className='text-sm text-muted-foreground text-center py-8'>You have no active listings.</p>
                     ) : (
                        <p className='text-sm text-muted-foreground text-center py-8'>Become an owner to list your own space.</p>
                     )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
