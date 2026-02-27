
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Job } from '@/lib/job-data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Loader2, MapPin, Search } from 'lucide-react';
import FavoriteButton from '@/components/favorite-button';

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const { user } = useUser();
  const firestore = useFirestore();

  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobs'), limit(40));
  }, [firestore]);

  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(jobsQuery);
  
  const allJobs = jobs || [];
  const locations = useMemo(() => [...new Set(allJobs.map(j => j.location).filter(Boolean))], [allJobs]);
  const jobTypes = useMemo(() => [...new Set(allJobs.map(j => j.type).filter(Boolean))], [allJobs]);

  const suggestedJobsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, `jobs`), where("type", "==", "Full-time"), limit(3));
  }, [firestore, user?.uid]);

  const { data: suggestedJobs, isLoading: suggestedJobsLoading } = useCollection<Job>(suggestedJobsQuery);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return allJobs.filter(job => {
      const term = searchTerm.toLowerCase();
      const titleMatch = job.title && job.title.toLowerCase().includes(term);
      const companyMatch = job.companyName && job.companyName.toLowerCase().includes(term);
      const locationMatch = locationFilter === 'all' || (job.location && job.location === locationFilter);
      const typeMatch = typeFilter === 'all' || (job.type && job.type === typeFilter);
      return (titleMatch || companyMatch) && locationMatch && typeMatch;
    });
  }, [allJobs, searchTerm, locationFilter, typeFilter]);

  const displayedJobs = searchTerm || locationFilter !== 'all' || typeFilter !== 'all' ? filteredJobs : allJobs;

  return (
    <div className="container mx-auto py-8 sm:py-12 px-4">
      <header className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-headline">Find Your Next Opportunity</h1>
        <p className="mt-3 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">Search through thousands of open positions. Your dream job is just a click away.</p>
      </header>

      <Card className="p-4 sm:p-6 mb-8 sm:mb-12 shadow-md">
        {isClient && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div className="sm:col-span-2 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder='Search for jobs or company...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full h-10 text-sm"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="h-10">
              <div className='flex items-center overflow-hidden'>
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10">
               <div className='flex items-center overflow-hidden'>
                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Job Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {jobTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        )}
      </Card>

      {user && suggestedJobs && suggestedJobs.length > 0 && (
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Suggested for You</h2>
           {suggestedJobsLoading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {suggestedJobs.map(job => (
                  <JobCard key={`suggested-${job.id}`} job={job} />
                ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">All Jobs</h2>
        {jobsLoading ? (
           <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin" /></div>
        ) : displayedJobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
           <div className='text-center py-16 border-2 border-dashed rounded-lg'>
              <h3 className="mt-2 text-lg font-medium">No jobs found.</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
          </div>
        )}
        {displayedJobs.length > 0 && (searchTerm || locationFilter !== 'all' || typeFilter !== 'all') && (
           <div className="text-center mt-8 sm:mt-12">
              <p className="text-xs sm:text-sm text-muted-foreground">Showing {filteredJobs.length} of {allJobs.length} jobs.</p>
           </div>
        )}
      </section>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const salarySymbol = job.salaryCurrencySymbol || '$';
  return (
    <Card className="hover:shadow-lg transition-all duration-300 h-full flex flex-col relative bg-muted/30">
      <FavoriteButton item={job} itemType="job" />
      <CardHeader className="p-4 sm:p-6 pb-2">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg font-bold leading-tight line-clamp-2">{job.title}</CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm truncate">{job.companyName}</CardDescription>
            </div>
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                {job.companyName?.charAt(0) || '?'}
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 sm:p-6 pt-2">
        <div className="space-y-2 text-xs sm:text-sm text-muted-foreground flex-grow">
            <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-2 shrink-0" />
                <span className="truncate">{job.location}, {job.country}</span>
            </div>
             <div className="flex items-center">
                <Briefcase className="h-3.5 w-3.5 mr-2 shrink-0" />
                <span>{job.type}</span>
            </div>
        </div>
        <Separator className="my-3 sm:my-4" />
        <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
                {job.salaryMin && job.salaryMax ? (
                    <p className="font-semibold text-sm sm:text-base truncate">{salarySymbol}{Math.floor(job.salaryMin/1000)}k - {salarySymbol}{Math.floor(job.salaryMax/1000)}k</p>
                ) : (
                     <p className="font-semibold text-sm sm:text-base">Competitive</p>
                )}
            </div>
            <Link href={`/jobs/${job.id}`} passHref>
                 <Button size='sm' className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm">View</Button>
            </Link>
        </div>
      </CardContent>
    </Card>
  );
}
