
'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wand2, Search, Heart, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useUser, useDoc, collection, doc, query, where, getDocs } from '@/firebase';
import { Job } from '@/lib/data';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin } from 'lucide-react';

type SeekerDashboardProps = {
    userProfile: {
        firstName: string;
        lastName: string;
        favoriteJobs?: string[];
    } | null;
}

type UserProfile = {
    favoriteJobs?: string[];
}

function FavoriteJobsList() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [favoriteJobs, setFavoriteJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const userDocRef = useMemo(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        const fetchFavoriteJobs = async () => {
            if (!userProfile || !userProfile.favoriteJobs || userProfile.favoriteJobs.length === 0 || !firestore) {
                setFavoriteJobs([]);
                setIsLoading(false);
                return;
            }

            try {
                const jobsRef = collection(firestore, 'jobListings');
                const q = query(jobsRef, where('id', 'in', userProfile.favoriteJobs));
                const querySnapshot = await getDocs(q);
                const jobs = querySnapshot.docs.map(doc => doc.data() as Job);
                setFavoriteJobs(jobs);
            } catch (error) {
                console.error("Error fetching favorite jobs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavoriteJobs();
    }, [userProfile, firestore]);


    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-primary" />
            </div>
        )
    }

    if (!favoriteJobs || favoriteJobs.length === 0) {
        return (
             <CardContent className="flex flex-col items-center justify-center text-center p-8">
                <Heart className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">You haven't saved any jobs yet.</p>
                <Link href="/jobs" className="mt-4">
                    <Button variant="outline">
                        <Search className="mr-2 h-4 w-4"/>
                        Browse Jobs
                    </Button>
                </Link>
            </CardContent>
        )
    }

    return (
        <CardContent>
            <div className="grid grid-cols-1 gap-4">
                 {favoriteJobs.map((job) => (
                     <Card
                        key={job.id}
                        className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg"
                    >
                        <CardHeader className="flex flex-row items-start gap-4 p-4">
                        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", job.logoBg)}>
                            <Image
                            src={job.logoUrl}
                            alt={`${job.company} logo`}
                            width={40}
                            height={40}
                            className="rounded-md object-contain"
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">{job.company}</p>
                            <CardTitle className="text-lg">
                            <Link href={`/jobs/${job.id}`} className="hover:underline">
                                {job.title}
                            </Link>
                            </CardTitle>
                        </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-4 pt-0">
                        <div className="flex flex-wrap gap-2 text-sm">
                            <Badge variant="outline">{job.type}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                            {job.workArrangement === 'Remote' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                            {job.location}
                            </Badge>
                        </div>
                        <p className="mt-4 text-base font-semibold">
                            {job.currencySymbol}{job.salary}
                        </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </CardContent>
    )

}

export default function SeekerDashboard({ userProfile }: SeekerDashboardProps) {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Welcome, {userProfile?.firstName || 'Job Seeker'}!</h1>
        <p className="text-muted-foreground">Let's find your next opportunity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>AI-Powered Job Matching</CardTitle>
                <CardDescription>Let our AI find the best roles for you based on your skills and experience.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center p-8">
                <Wand2 className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold">Get Personalized Suggestions</h3>
                <p className="text-muted-foreground mb-4">Answer a few questions and let our AI do the searching.</p>
                <Link href="/ai-matching">
                    <Button className="bg-accent hover:bg-accent/90">
                        <Wand2 className="mr-2 h-4 w-4"/>
                        Start AI Matching
                    </Button>
                </Link>
            </CardContent>
        </Card>
        
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Applications</CardTitle>
                    <CardDescription>Track the status of your job applications.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center p-8">
                    <FileText className="w-10 h-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
                    <Link href="/jobs" className="mt-4">
                        <Button variant="outline">
                            <Search className="mr-2 h-4 w-4"/>
                            Browse Jobs
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
      <div className="mt-8">
        <Card>
            <CardHeader>
                <CardTitle>My Favorite Jobs</CardTitle>
                <CardDescription>Jobs you've saved for later.</CardDescription>
            </CardHeader>
            <FavoriteJobsList />
        </Card>
      </div>
    </div>
  );
}
