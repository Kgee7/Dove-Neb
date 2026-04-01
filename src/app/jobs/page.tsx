
'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Job, formatSalaryAmount } from '@/lib/job-data';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Loader2, MapPin, Search, Users } from 'lucide-react';
import FavoriteButton from '@/components/favorite-button';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

function JobsPageClient() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [locationTerm, setLocationTerm] = useState(searchParams.get('l') || '');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const firestore = useFirestore();

  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    // Only fetch active jobs
    return query(collection(firestore, 'jobs'), where('status', '==', 'active'), limit(100));
  }, [firestore]);

  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(jobsQuery);
  
  const allJobs = jobs || [];

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    // Use string comparison for timezone-robust filtering
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    return allJobs.filter(job => {
      const term = searchTerm.toLowerCase();
      const lTerm = locationTerm.toLowerCase();
      
      const titleMatch = job.title?.toLowerCase().includes(term) || job.companyName?.toLowerCase().includes(term);
      const locationMatch = !lTerm || job.location?.toLowerCase().includes(lTerm) || job.country?.toLowerCase().includes(lTerm);
      
      // Robust Date Filtering using string comparison
      const isStarted = !job.listingStartDate || todayStr >= job.listingStartDate;
      const isNotExpired = !job.listingEndDate || todayStr <= job.listingEndDate;
      const dateMatch = isStarted && isNotExpired;

      return titleMatch && locationMatch && dateMatch && job.status === 'active';
    });
  }, [allJobs, searchTerm, locationTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="container mx-auto py-8 sm:py-12 px-4">
      <header className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight font-headline">Find Your Next Opportunity</h1>
        <p className="mt-2 text-[10px] sm:text-xs md:text-lg text-muted-foreground max-w-2xl mx-auto">Search through thousands of open positions. Your dream job is just a click away.</p>
      </header>

      <Card className="mx-auto mb-8 sm:mb-12 max-w-2xl shadow-md bg-background/95 backdrop-blur-sm border-none overflow-hidden">
        {isClient && (
        <form className="flex items-center gap-1 p-1 sm:p-1.5" onSubmit={handleSearch}>
          <div className="flex flex-1 items-center bg-muted/30 rounded-md sm:rounded-full border focus-within:ring-1 focus-within:ring-primary overflow-hidden h-8 sm:h-9">
            <div className="flex flex-1 items-center px-2 border-r border-muted-foreground/20 h-full">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input 
                placeholder='Job title'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-none bg-transparent focus-visible:ring-0 h-full text-[10px] sm:text-xs px-2"
              />
            </div>
            <div className="flex flex-1 items-center px-2 h-full">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input 
                placeholder='Location'
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="border-none bg-transparent focus-visible:ring-0 h-full text-[10px] sm:text-xs px-2"
              />
            </div>
          </div>
          <Button type="submit" className="h-8 sm:h-9 px-5 rounded-md sm:rounded-full font-bold shrink-0 text-[10px] sm:text-xs">
            Search
          </Button>
        </form>
        )}
      </Card>

      <section>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-center">All Jobs</h2>
        {jobsLoading ? (
           <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin" /></div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
           <div className='text-center py-16 border-2 border-dashed rounded-lg'>
              <h3 className="mt-2 text-lg font-medium">No jobs found.</h3>
              <p className="mt-1 text-[10px] sm:text-sm text-muted-foreground">Try adjusting your search terms.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const salarySymbol = job.salaryCurrencySymbol || '$';
  const salaryFrequency = job.salaryPeriod === 'hour' ? '/ hr' : '/ mo';
  return (
    <Card className="hover:shadow-lg transition-all duration-300 h-full flex flex-col relative bg-muted/30">
      <FavoriteButton item={job} itemType="job" />
      <CardHeader className="p-4 sm:p-6 pb-2">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-sm sm:text-lg font-bold leading-tight line-clamp-2">{job.title}</CardTitle>
                </div>
                <CardDescription className="text-[10px] sm:text-sm truncate">{job.companyName}</CardDescription>
            </div>
             <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center font-bold text-xs sm:text-lg shrink-0">
                {job.companyName?.charAt(0) || '?'}
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 sm:p-6 pt-2">
        <div className="space-y-2 text-[10px] sm:text-sm text-muted-foreground flex-grow">
            <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-2 shrink-0" />
                <span className="truncate">{job.location}, {job.country}</span>
            </div>
             <div className="flex items-center">
                <Briefcase className="h-3 w-3 mr-2 shrink-0" />
                <span>{job.type}</span>
            </div>
            {job.positionsAvailable && (
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-2 shrink-0" />
                <span>{job.positionsAvailable} Position{job.positionsAvailable > 1 ? 's' : ''} Available</span>
              </div>
            )}
        </div>
        <Separator className="my-3 sm:my-4" />
        <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
                {job.salaryMin && job.salaryMax ? (
                    <p className="font-semibold text-[10px] sm:text-base truncate">
                      {salarySymbol}{formatSalaryAmount(job.salaryMin)} - {salarySymbol}{formatSalaryAmount(job.salaryMax)} {salaryFrequency}
                    </p>
                ) : (
                     <p className="font-semibold text-[10px] sm:text-base">Competitive</p>
                )}
            </div>
            <Link href={`/jobs/${job.id}`} passHref>
                 <Button size='sm' className="h-7 sm:h-9 px-3 sm:px-4 text-[10px] sm:text-sm">View</Button>
            </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
      <JobsPageClient />
    </Suspense>
  );
}
