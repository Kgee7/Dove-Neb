
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
  Bot,
  Star,
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
      <section className="relative h-[65vh] w-full min-h-[400px] lg:h-[75vh]">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
          <div className="container max-w-2xl">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl font-headline transition-all">
              Where Opportunities Take Flight
            </h1>
            <p className="mt-2 text-xs text-white/80 sm:text-base md:text-lg lg:text-xl">
              Find your dream job and the perfect place to stay.
            </p>
            <Card className="mx-auto mt-6 max-w-lg shadow-2xl overflow-hidden border-none bg-background/95 backdrop-blur-sm">
              {isClient && 
               <Tabs defaultValue="jobs" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-none h-10">
                  <TabsTrigger value="jobs" className="text-xs sm:text-sm">Find a Job</TabsTrigger>
                  <TabsTrigger value="rooms" className="text-xs sm:text-sm">Find a Space</TabsTrigger>
                </TabsList>
                <TabsContent value="jobs">
                  <CardContent className="p-3">
                    <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleJobSearch}>
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Job title..."
                          className="pl-8 h-9 text-xs sm:text-sm focus-visible:ring-primary"
                          value={jobSearchQuery}
                          onChange={(e) => setJobSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="relative flex-1">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                          placeholder="Location" 
                          className="pl-8 h-9 text-xs sm:text-sm focus-visible:ring-primary"
                          value={jobLocationQuery}
                          onChange={(e) => setJobLocationQuery(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="h-9 px-4 text-xs sm:text-sm shrink-0 font-semibold">
                        <Search className="h-3.5 w-3.5 sm:mr-2" />
                        <span className="sm:inline">Search</span>
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>
                <TabsContent value="rooms">
                   <CardContent className="p-3">
                    <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleRoomSearch}>
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Destination..."
                          className="pl-8 h-9 text-xs sm:text-sm focus-visible:ring-primary"
                          value={roomSearchQuery}
                          onChange={(e) => setRoomSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="relative flex-1">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                          placeholder="Location" 
                          className="pl-8 h-9 text-xs sm:text-sm focus-visible:ring-primary"
                          value={roomLocationQuery}
                          onChange={(e) => setRoomLocationQuery(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="h-9 px-4 text-xs sm:text-sm shrink-0 font-semibold">
                        <Search className="h-3.5 w-3.5 sm:mr-2" />
                        <span className="sm:inline">Search</span>
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
      <section className="bg-muted/30 py-12 sm:py-20">
        <div className="container px-4">
          <div className="mb-8 sm:mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl font-headline">
              Featured Jobs
            </h2>
            <p className="mt-2 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
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
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobs?.map((job) => {
                const salarySymbol = job.salaryCurrencySymbol || '$';
                return (
                <Card
                  key={job.id}
                  className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg bg-muted/30"
                >
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.title}
                        </Link>
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center pt-1">
                        <Building2 className="h-3.5 w-3.5 mr-2" />
                        {job.companyName}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col p-4 sm:p-6 pt-0 sm:pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-2" />
                        {job.location}, {job.country}
                    </p>
                    <div className="mt-4 flex-grow" />
                    <div className="flex justify-between items-center mt-2">
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">{job.type}</Badge>
                        {(job.salaryMin && job.salaryMax) && (
                          <p className="text-base sm:text-lg font-semibold">
                              {salarySymbol}{job.salaryMin/1000}k - {salarySymbol}{job.salaryMax/1000}k
                          </p>
                        )}
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
          <div className="mt-8 sm:mt-12 text-center">
            <Link
              href="/jobs"
              className={cn(buttonVariants({ size: "lg", className: "w-full sm:w-auto" }))}
            >
              Explore All Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-12 sm:py-20">
        <div className="container px-4">
          <div className="mb-8 sm:mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl font-headline">
              Featured Stays
            </h2>
            <p className="mt-2 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
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
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms?.map((room) => (
                <Card
                  key={room.id}
                  className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg"
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
                    <div className="flex justify-between items-start mb-1 gap-2">
                        <CardTitle className="text-base sm:text-xl line-clamp-1">
                            <Link href={`/rooms/${room.id}`} className="hover:underline">
                            {room.title}
                            </Link>
                        </CardTitle>
                        {(room.interestCount !== undefined && room.interestCount > 0) ? (
                            <div className="flex items-center gap-1 text-xs sm:text-sm font-bold shrink-0">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span>5.0</span>
                                <span className="text-muted-foreground font-normal">({room.interestCount})</span>
                            </div>
                        ) : null}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {room.location}, {room.country}
                    </p>
                    <div className="mt-4 flex-grow" />
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-base sm:text-lg font-semibold">
                            {room.listingType === 'sale' && room.salePrice ? (
                                `${room.currencySymbol}${room.salePrice.toLocaleString()}`
                            ) : room.listingType === 'rent' && room.priceNight ? (
                                <>
                                    {room.currencySymbol}{room.priceNight}
                                    <span className="text-xs font-normal text-muted-foreground">/night</span>
                                </>
                            ) : room.listingType === 'rent' && room.priceMonth ? (
                                <>
                                    {room.currencySymbol}{room.priceMonth}
                                    <span className="text-xs font-normal text-muted-foreground">/month</span>
                                </>
                            ) : null}
                        </p>
                        <Badge variant={room.listingType === 'sale' ? 'default' : 'outline'} className="capitalize text-[10px] sm:text-xs">{room.listingType}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-8 sm:mt-12 text-center">
            <Link
              href="/rooms"
              className={cn(buttonVariants({ size: "lg", className: "w-full sm:w-auto" }))}
            >
              Explore All Spaces
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Link
        href="/support"
        className={cn(
          buttonVariants({ size: 'icon', className: 'rounded-full' }),
          'fixed bottom-6 right-6 h-14 w-14 sm:h-16 sm:w-16 shadow-lg z-40'
        )}
      >
        <Bot className="h-7 w-7 sm:h-8 sm:w-8" />
        <span className="sr-only">Chat with AI Support</span>
      </Link>
    </div>
  );
}
