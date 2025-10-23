'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from "next/navigation";
import { useCollection, useFirestore } from '@/firebase';
import { Job } from '@/lib/job-data';
import { useState, useMemo } from 'react';
import { collection, query } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Search, Building2, Briefcase, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function JobsListingPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('loc') || '');

  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobs'));
  }, [firestore]);
  
  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter(job => {
      const searchLower = searchQuery.toLowerCase();
      const locationLower = locationQuery.toLowerCase();
      
      const matchesSearch = searchQuery === '' || 
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.companyName.toLowerCase().includes(searchLower);

      const matchesLocation = locationQuery === '' ||
        job.location.toLowerCase().includes(locationLower);

      return matchesSearch && matchesLocation;
    });
  }, [jobs, searchQuery, locationQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', searchQuery);
    params.set('loc', locationQuery);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <div className="container py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl font-headline">
          Find Your Next Job
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Browse thousands of open positions from top companies.
        </p>
      </div>

       <Card className="mx-auto mb-12 max-w-4xl shadow-lg">
          <CardContent className="p-4">
            <form className="flex flex-col gap-4 sm:flex-row" onSubmit={handleSearch}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Job title, keywords, or company"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Location" 
                  className="pl-10"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="bg-accent hover:bg-accent/90">
                Search Jobs
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
            filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg"
              >
                <CardHeader>
                    <CardTitle className="text-xl">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                            {job.title}
                        </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                        <Building2 className='h-4 w-4' />
                        {job.companyName}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className='text-sm text-muted-foreground space-y-2'>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span>{job.type}</span>
                        </div>
                         {(job.salaryMin && job.salaryMax) && (
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>${job.salaryMin/1000}k - ${job.salaryMax/1000}k</span>
                            </div>
                        )}
                    </div>
                </CardContent>
                <div className='p-6 pt-0'>
                     <Button asChild className="w-full">
                        <Link href={`/jobs/${job.id}`}>View Details</Link>
                    </Button>
                </div>
              </Card>
            ))
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
