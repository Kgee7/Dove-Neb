
'use client';

import Link from "next/link";
import Image from "next/image";
import { Briefcase, MapPin, Search, Heart, Loader2, Globe } from "lucide-react";
import { collection } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

import { Job } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function JobsPage() {
  const firestore = useFirestore();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'jobListings');
  }, [firestore]);
  
  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

  return (
    <div className="bg-secondary/50">
      <div className="container py-8">
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight font-headline">Find Your Next Opportunity</h1>
          <p className="text-muted-foreground">
            Search through thousands of openings from top companies.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
              <div className="relative md:col-span-2 lg:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Job title, keywords..." className="pl-10" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Location" className="pl-10" />
              </div>
              <Select>
                <SelectTrigger>
                  <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
              <Button className="lg:col-start-5 bg-accent hover:bg-accent/90">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Listings */}
        <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Showing {jobs?.length || 0} results</p>
            <div className="flex items-center gap-2">
                <Label htmlFor="sort" className="text-sm">Sort by:</Label>
                <Select defaultValue="newest">
                    <SelectTrigger id="sort" className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="salary-asc">Salary (Low to High)</SelectItem>
                        <SelectItem value="salary-desc">Salary (High to Low)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && jobs && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
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
                      <Link
                        href={`/jobs/${job.id}`}
                        className="hover:underline"
                      >
                        {job.title}
                      </Link>
                    </CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <Heart className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="flex-grow p-4 pt-0">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline">{job.type}</Badge>
                     <Badge variant="outline" className="flex items-center gap-1">
                      {job.workArrangement === 'Remote' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {job.location}
                    </Badge>
                    <Badge variant="secondary">{job.category}</Badge>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    {job.salary}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                      Posted {job.postedDate}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
