'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Job, jobs as allJobs, jobTypes, locations } from '@/lib/job-data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Briefcase, MapPin, Search } from 'lucide-react';

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { user } = useUser();
  const firestore = useFirestore();

  const suggestedJobsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, `users/${user.uid}/suggested-jobs`));
  }, [firestore, user?.uid]);

  const { data: suggestedJobs } = useCollection<Job>(suggestedJobsQuery);


  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      const term = searchTerm.toLowerCase();
      const titleMatch = job.title.toLowerCase().includes(term);
      const companyMatch = job.company.toLowerCase().includes(term);
      const locationMatch = locationFilter === 'all' || job.location === locationFilter;
      const typeMatch = typeFilter === 'all' || job.type === typeFilter;
      return (titleMatch || companyMatch) && locationMatch && typeMatch;
    });
  }, [searchTerm, locationFilter, typeFilter]);

  const displayedJobs = searchTerm || locationFilter !== 'all' || typeFilter !== 'all' ? filteredJobs : allJobs.slice(0, 8);

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline">Find Your Next Opportunity</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">Search through thousands of open positions in the tech industry. Your dream job is just a click away.</p>
      </header>

      <Card className="p-6 md:p-8 mb-12 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-2 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder='Search for jobs by title or company...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <div className='flex items-center'>
                <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
               <div className='flex items-center'>
                <Briefcase className="h-5 w-5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Job Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {jobTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {user && suggestedJobs && suggestedJobs.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Suggested for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestedJobs.map(job => (
              <JobCard key={`suggested-${job.id}`} job={job} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold mb-6">All Jobs</h2>
        {displayedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
           <div className='text-center py-12 border-2 border-dashed rounded-lg'>
              <h3 className="mt-4 text-lg font-medium">No jobs found matching your criteria.</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search filters.</p>
          </div>
        )}
        {displayedJobs.length > 0 && (searchTerm || locationFilter !== 'all' || typeFilter !== 'all') && (
           <div className="text-center mt-12">
              <p className="text-muted-foreground">Showing {filteredJobs.length} of {allJobs.length} jobs.</p>
           </div>
        )}
      </section>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <Card className="hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div>
                <CardTitle className="text-lg font-bold leading-tight">{job.title}</CardTitle>
                <CardDescription className="mt-1">{job.company}</CardDescription>
            </div>
            <img src={job.logo} alt={`${job.company} logo`} className="w-12 h-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="space-y-3 text-sm text-muted-foreground flex-grow">
            <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{job.location}</span>
            </div>
             <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2" />
                <span>{job.type}</span>
            </div>
        </div>
        <Separator className="my-4" />
        <div className="flex items-center justify-between">
            <div>
                <p className="font-semibold text-lg">{job.salary}</p>
                <Badge variant='secondary' className='mt-1'>{job.posted}</Badge>
            </div>
            <Link href={`/jobs/${job.id}`} passHref>
                 <Button size='sm'>View Job</Button>
            </Link>
        </div>
      </CardContent>
    </Card>
  );
}
