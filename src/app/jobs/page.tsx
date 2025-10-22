
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCollection, useFirestore, collection } from '@/firebase';
import { Job } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JobsListingPage() {
  const firestore = useFirestore();

  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'jobListings');
  }, [firestore]);
  
  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs && jobs.length > 0 ? (
            jobs.map((job) => (
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <Heart className="h-4 w-4" />
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
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground py-16">
              No jobs found at the moment. Check back later!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
