
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from "next/navigation";
import { useCollection, useFirestore, useUser, useDoc, collection, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from '@/firebase';
import { Job } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Loader2, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function JobsListingPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('loc') || '');

  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'jobListings');
  }, [firestore]);
  
  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);
  const userDocRef = useMemo(() => firestore && user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter(job => {
      const searchLower = searchQuery.toLowerCase();
      const locationLower = locationQuery.toLowerCase();
      
      const matchesSearch = searchQuery === '' || 
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower);

      const matchesLocation = locationQuery === '' ||
        job.location.toLowerCase().includes(locationLower);

      return matchesSearch && matchesLocation;
    });
  }, [jobs, searchQuery, locationQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (locationQuery) params.set('loc', locationQuery);
    router.push(`/jobs?${params.toString()}`);
  };

  const toggleFavorite = async (jobId: string, isFavorited: boolean) => {
    if (!user || !firestore || !userDocRef) {
      router.push('/login');
      return;
    }
    
    if (isFavorited) {
      await updateDoc(userDocRef, { favoriteJobs: arrayRemove(jobId) });
    } else {
      await updateDoc(userDocRef, { favoriteJobs: arrayUnion(jobId) });
    }
  };

  return (
    <div className="container py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl font-headline">
          Browse Job Openings
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Find your next opportunity from our curated list of roles.
        </p>
      </div>

       <Card className="mx-auto mb-12 max-w-4xl shadow-lg">
          <CardContent className="p-4">
            <form className="flex flex-col gap-4 sm:flex-row" onSubmit={handleSearch}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Job title, keywords, or company"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="City, state, or zip code" 
                  className="pl-10"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="bg-accent hover:bg-accent/90">
                Find Jobs
              </Button>
            </form>
          </CardContent>
        </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => {
               const isFavorited = userProfile?.favoriteJobs?.includes(job.id);
               return (
              <Card
                key={job.id}
                className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-2xl"
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => toggleFavorite(job.id, isFavorited)}>
                     <Heart className={cn("h-4 w-4", isFavorited && "fill-red-500 text-red-500")} />
                  </Button>
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
            )})
          ) : (
            <p className="col-span-full text-center text-muted-foreground py-16">
              No jobs found matching your criteria. Try broadening your search!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
