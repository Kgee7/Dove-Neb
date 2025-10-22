'use client';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from "lucide-react";
import EmployerDashboard from './employer-dashboard';
import SeekerDashboard from './seeker-dashboard';

type UserProfile = {
  userType: 'seeker' | 'employer';
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

  if (userProfile?.userType === 'employer') {
    return <EmployerDashboard />;
  }

  if (userProfile?.userType === 'seeker') {
    return <SeekerDashboard userProfile={userProfile} />;
  }

  // Fallback or a generic dashboard if userType is not set
  return (
    <div className="container py-10 text-center">
        <h1 className="text-3xl font-bold font-headline">Welcome!</h1>
        <p className="text-muted-foreground">Loading your dashboard...</p>
    </div>
  );
}
