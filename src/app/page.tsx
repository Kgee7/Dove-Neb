
'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Home,
  Search,
  MapPin,
  BedDouble,
  Loader2,
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
import data from "@/lib/placeholder-images.json";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function HomePage() {
  const heroImage = data.placeholderImages.find(
    (img) => img.id === "hero-background"
  );
  
  const firestore = useFirestore();
  const router = useRouter();

  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobLocationQuery, setJobLocationQuery] = useState('');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomLocationQuery, setRoomLocationQuery] = useState('');
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const roomsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'rooms'), limit(6));
  }, [firestore]);
  
  const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(
    roomsQuery
  );

  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobs'), limit(6));
  }, [firestore]);

  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(
    jobsQuery
  );

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
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
          <div className="container max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl font-headline">
              Where Opportunities Take Flight
            </h1>
            <p className="mt-4 text-lg text-white/80 md:text-xl">
              Find your dream job and the perfect place to stay.
            </p>
            <Card className="mx-auto mt-8 max-w-2xl shadow-2xl">
              {isClient && 
               <Tabs defaultValue="jobs" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="jobs">Find a Job</TabsTrigger>
                  <TabsTrigger value="rooms">Find a Space</TabsTrigger>
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
                      <Button type="submit">
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
                      <Button type="submit">
                        Search Spaces
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>
              </Tabs>
              }
            </Card>
          </div>
        </div>
      </section>
      
       {/* Featured Jobs Section */}
      <section className="bg-muted/30 py-16 sm:py-24">
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
             <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Could not load jobs. The backend may be offline.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center">
              {jobs?.map((job) => {
                const salarySymbol = job.salaryCurrencySymbol || '$';
                return (
                <Card
                  key={job.id}
                  className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg w-full max-w-sm text-white"
                  style={{ backgroundColor: '#88E788' }}
                >
                  <CardHeader>
                     <CardTitle className="text-xl">
                        <Link href={`/jobs/${job.id}`} className="hover:underline text-white">
                          {job.title}
                        </Link>
                    </CardTitle>
                     <p className="text-sm text-white/80 flex items-center pt-1">
                        <Building2 className="h-4 w-4 mr-2" />
                        {job.companyName}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <p className="text-sm text-white/80 mt-1 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {job.location}, {job.country}
                    </p>
                    <div className="mt-4 flex-grow" />
                     <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline" className="border-white/50 text-white">{job.type}</Badge>
                        {(job.salaryMin && job.salaryMax) && (
                           <p className="text-lg font-semibold">
                              {salarySymbol}{job.salaryMin/1000}k - {salarySymbol}{job.salaryMax/1000}k
                          </p>
                        )}
                     </div>
                  </CardContent>
                </Card>
              )})}
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
              Explore some of our most popular and highly-rated spaces.
            </p>
          </div>
          {roomsLoading ? (
             <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : !rooms || rooms.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Could not load rooms. The backend may be offline.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center">
              {rooms?.map((room) => (
                <Card
                  key={room.id}
                  className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg w-full max-w-sm"
                >
                  <CardHeader className="p-0">
                    <Link href={`/rooms/${room.id}`}>
                      <div className="relative aspect-video">
                        <Image
                            src={room.images[0] || "/placeholder.jpg"}
                            alt={room.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    </Link>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <CardTitle className="text-xl">
                        <Link href={`/rooms/${room.id}`} className="hover:underline">
                          {room.title}
                        </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {room.location}, {room.country}
                    </p>
                    <div className="mt-4 flex-grow" />
                     <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-semibold">
                            {room.listingType === 'sale' && room.salePrice ? (
                                <>
                                    {room.currencySymbol}{room.salePrice.toLocaleString()}
                                </>
                            ) : room.listingType === 'rent' && room.priceNight ? (
                                <>
                                    {room.currencySymbol}{room.priceNight}
                                    <span className="text-sm font-normal text-muted-foreground">/night</span>
                                </>
                            ) : null}
                        </p>
                        <Badge variant={room.listingType === 'sale' ? 'default' : 'outline'} className="capitalize">{room.listingType}</Badge>
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
              Explore All Spaces
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

    
