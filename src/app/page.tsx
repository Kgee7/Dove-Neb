'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Home,
  Search,
  MapPin,
  BedDouble,
} from "lucide-react";
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Room } from "@/lib/data";
import { Job } from "@/lib/job-data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function HomePage() {
  const heroImage = PlaceHolderImages.find(
    (img) => img.id === "hero-background"
  );
  
  const firestore = useFirestore();
  const router = useRouter();

  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobLocationQuery, setJobLocationQuery] = useState('');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomLocationQuery, setRoomLocationQuery] = useState('');

  const roomsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'rooms'), limit(6));
  }, [firestore]);
  
  const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsQuery);

  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobs'), limit(6));
  }, [firestore]);

  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(jobsQuery);

  const handleJobSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (jobSearchQuery) params.set('q', jobSearchQuery);
    if (jobLocationQuery) params.set('loc', jobLocationQuery);
    router.push(`/jobs?${params.toString()}`);
  };

  const handleRoomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (roomSearchQuery) params.set('q', roomSearchQuery);
    if (roomLocationQuery) params.set('loc', roomLocationQuery);
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[550px] w-full">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-background/40" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
          <div className="container max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl font-headline">
              Where Opportunities Take Flight
            </h1>
            <p className="mt-4 text-lg text-foreground/90 md:text-xl">
              Find your dream job and the perfect place to stay.
            </p>
            <Card className="mx-auto mt-8 max-w-2xl shadow-lg">
               <Tabs defaultValue="jobs" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="jobs">Find a Job</TabsTrigger>
                  <TabsTrigger value="rooms">Find a Room</TabsTrigger>
                </TabsList>
                <TabsContent value="jobs">
                  <CardContent className="p-4">
                    <form className="flex flex-col gap-4 sm:flex-row" onSubmit={handleJobSearch}>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Job title, keywords, or company"
                          className="pl-10"
                          value={jobSearchQuery}
                          onChange={(e) => setJobSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Location" 
                          className="pl-10"
                          value={jobLocationQuery}
                          onChange={(e) => setJobLocationQuery(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="bg-accent hover:bg-accent/90">
                        Search Jobs
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>
                <TabsContent value="rooms">
                   <CardContent className="p-4">
                    <form className="flex flex-col gap-4 sm:flex-row" onSubmit={handleRoomSearch}>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Destination, e.g., 'downtown'"
                          className="pl-10"
                          value={roomSearchQuery}
                          onChange={(e) => setRoomSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Location" 
                          className="pl-10"
                          value={roomLocationQuery}
                          onChange={(e) => setRoomLocationQuery(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="bg-accent hover:bg-accent/90">
                        Search Rooms
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </section>
      
       {/* Featured Jobs Section */}
      <section className="bg-secondary/50 py-16 sm:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl font-headline">
              Featured Jobs
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Explore some of our most popular and recently added jobs.
            </p>
          </div>
          {jobsLoading ? (
             <div className="flex justify-center items-center h-40">...loading</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobs?.map((job) => (
                <Card
                  key={job.id}
                  className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-2xl"
                >
                  <CardHeader>
                     <CardTitle className="text-lg">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.title}
                        </Link>
                    </CardTitle>
                     <p className="text-sm text-muted-foreground flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        {job.companyName}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <p className="text-sm text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {job.location}
                    </p>
                    <div className="mt-4 flex-grow" />
                     <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline">{job.type}</Badge>
                        <p className="text-lg font-semibold">
                            ${job.salaryMin/1000}k - ${job.salaryMax/1000}k
                        </p>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-12 text-center">
            <Link
              href="/jobs"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Explore All Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-16 sm:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl font-headline">
              Featured Stays
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Explore some of our most popular and highly-rated rooms.
            </p>
          </div>
          {roomsLoading ? (
             <div className="flex justify-center items-center h-40">...loading</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms?.map((room) => (
                <Card
                  key={room.id}
                  className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-2xl"
                >
                  <CardHeader className="p-0">
                    <Link href={`/rooms/${room.id}`}>
                      <div className="relative aspect-video">
                        <Image
                            src={room.images[0] || "/placeholder.jpg"}
                            alt={room.title}
                            fill
                            className="object-cover"
                        />
                      </div>
                    </Link>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <CardTitle className="text-lg">
                        <Link href={`/rooms/${room.id}`} className="hover:underline">
                          {room.title}
                        </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {room.location}
                    </p>
                    <div className="mt-4 flex-grow" />
                     <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-semibold">
                            {room.currencySymbol}{room.price}
                            <span className="text-sm font-normal text-muted-foreground">/night</span>
                        </p>
                        <Badge variant="outline">New</Badge>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-12 text-center">
            <Link
              href="/rooms"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Explore All Rooms
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
