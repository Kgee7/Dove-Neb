
'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  MapPin,
  Home,
  Loader2,
  Bot,
  Star,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
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

  const [jobSearch, setJobSearch] = useState('');
  const [jobLoc, setJobLoc] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [roomLoc, setRoomLoc] = useState('');
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
    if (jobSearch) params.set('q', jobSearch);
    if (jobLoc) params.set('l', jobLoc);
    router.push(`/jobs?${params.toString()}`);
  };

  const handleRoomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (roomSearch) params.set('q', roomSearch);
    if (roomLoc) params.set('l', roomLoc);
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative h-[40vh] sm:h-[55vh] lg:h-[65vh] w-full min-h-[280px]">
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
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white font-headline animate-in fade-in slide-in-from-bottom-4 duration-700">
              Where Opportunities Take Flight
            </h1>
            <p className="mt-1 text-[10px] sm:text-xs md:text-base lg:text-lg text-white/80 animate-in fade-in slide-in-from-bottom-4 delay-100 duration-700">
              Find your dream job and the perfect place to stay.
            </p>
            
            <Card className="mx-auto mt-4 sm:mt-6 w-full max-w-lg shadow-2xl overflow-hidden border-none bg-background/95 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 delay-200 duration-700">
              {isClient && 
               <Tabs defaultValue="jobs" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-none h-8 sm:h-9">
                  <TabsTrigger value="jobs" className="text-[10px] sm:text-xs">Find a Job</TabsTrigger>
                  <TabsTrigger value="rooms" className="text-[10px] sm:text-xs">Find a Space</TabsTrigger>
                </TabsList>
                <TabsContent value="jobs" className="mt-0">
                  <CardContent className="p-1 sm:p-1.5">
                    <form className="flex flex-col sm:flex-row items-center gap-1" onSubmit={handleJobSearch}>
                      <div className="flex flex-1 w-full items-center bg-muted/30 rounded-md sm:rounded-full border focus-within:ring-1 focus-within:ring-primary overflow-hidden">
                        <div className="flex flex-1 items-center px-2 w-full border-r border-muted-foreground/20">
                          <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                          <Input
                            placeholder="Job title"
                            className="border-none bg-transparent focus-visible:ring-0 h-7 sm:h-8 text-[10px] sm:text-xs w-full px-2"
                            value={jobSearch}
                            onChange={(e) => setJobSearch(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-1 items-center px-2 w-full">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <Input
                            placeholder="Location"
                            className="border-none bg-transparent focus-visible:ring-0 h-7 sm:h-8 text-[10px] sm:text-xs w-full px-2"
                            value={jobLoc}
                            onChange={(e) => setJobLoc(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full sm:w-auto h-7 sm:h-8 px-4 rounded-md sm:rounded-full font-bold text-[10px] sm:text-xs">
                        Search
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>
                <TabsContent value="rooms" className="mt-0">
                   <CardContent className="p-1 sm:p-1.5">
                    <form className="flex flex-col sm:flex-row items-center gap-1" onSubmit={handleRoomSearch}>
                      <div className="flex flex-1 w-full items-center bg-muted/30 rounded-md sm:rounded-full border focus-within:ring-1 focus-within:ring-primary overflow-hidden">
                        <div className="flex flex-1 items-center px-2 w-full border-r border-muted-foreground/20">
                          <Home className="h-3 w-3 text-muted-foreground shrink-0" />
                          <Input
                            placeholder="Type of space"
                            className="border-none bg-transparent focus-visible:ring-0 h-7 sm:h-8 text-[10px] sm:text-xs w-full px-2"
                            value={roomSearch}
                            onChange={(e) => setRoomSearch(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-1 items-center px-2 w-full">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <Input
                            placeholder="Location"
                            className="border-none bg-transparent focus-visible:ring-0 h-7 sm:h-8 text-[10px] sm:text-xs w-full px-2"
                            value={roomLoc}
                            onChange={(e) => setRoomLoc(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full sm:w-auto h-7 sm:h-8 px-4 rounded-md sm:rounded-full font-bold text-[10px] sm:text-xs">
                        Search
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
      <section className="bg-muted/30 py-8 sm:py-16">
        <div className="container px-4">
          <div className="mb-6 sm:mb-10 text-center">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight font-headline">
              Featured Jobs
            </h2>
            <p className="mt-1 text-[10px] sm:text-sm text-muted-foreground max-w-2xl mx-auto">
              Explore some of our most popular and recently added jobs.
            </p>
          </div>
          {jobsLoading ? (
             <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs sm:text-sm text-muted-foreground italic">No jobs available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobs?.map((job) => {
                const salarySymbol = job.salaryCurrencySymbol || '$';
                return (
                <Card
                  key={job.id}
                  className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg bg-muted/30 border-muted/50"
                >
                  <div className="p-4 sm:p-6 pb-2 sm:pb-3">
                    <h3 className="text-sm sm:text-base font-bold line-clamp-1">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.title}
                        </Link>
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center pt-1">
                        <Building2 className="h-3 w-3 mr-1.5 shrink-0" />
                        <span className="truncate">{job.companyName}</span>
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col p-4 sm:p-6 pt-0 sm:pt-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-3 w-3 mr-1.5 shrink-0" />
                        <span className="truncate">{job.location}, {job.country}</span>
                    </p>
                    <div className="mt-4 flex-grow" />
                    <div className="flex justify-between items-center mt-2 pt-3 border-t">
                        <Badge variant="secondary" className="text-[8px] sm:text-[10px] py-0 h-5">{job.type}</Badge>
                        {(job.salaryMin && job.salaryMax) && (
                          <p className="text-xs sm:text-sm font-semibold">
                              {salarySymbol}{job.salaryMin/1000}k - {salarySymbol}{job.salaryMax/1000}k
                          </p>
                        )}
                    </div>
                  </div>
                </Card>
              )})}
            </div>
          )}
          <div className="mt-6 sm:mt-10 text-center">
            <Link
              href="/jobs"
              className={cn(buttonVariants({ size: "sm", className: "w-full sm:w-auto font-bold px-8 h-10" }))}
            >
              Explore All Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-8 sm:py-16">
        <div className="container px-4">
          <div className="mb-6 sm:mb-10 text-center">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight font-headline">
              Featured Stays
            </h2>
            <p className="mt-1 text-[10px] sm:text-sm text-muted-foreground max-w-2xl mx-auto">
              Explore some of our most popular and highly-rated spaces.
            </p>
          </div>
          {roomsLoading ? (
             <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : !rooms || rooms.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs sm:text-sm text-muted-foreground italic">No spaces available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms?.map((room) => (
                <Card
                  key={room.id}
                  className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg border-muted/50"
                >
                  <div className="p-0">
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
                  </div>
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="flex justify-between items-start mb-1 gap-2">
                        <h3 className="text-sm sm:text-base font-bold line-clamp-1">
                            <Link href={`/rooms/${room.id}`} className="hover:underline">
                            {room.title}
                            </Link>
                        </h3>
                        {(room.interestCount !== undefined && room.interestCount > 0) ? (
                            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold shrink-0 bg-primary/5 px-1.5 py-0.5 rounded">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>5.0</span>
                            </div>
                        ) : null}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{room.location}, {room.country}</span>
                    </p>
                    <div className="mt-4 flex-grow" />
                    <div className="flex justify-between items-center mt-2 pt-3 border-t">
                        <p className="text-sm sm:text-base font-bold text-primary">
                            {room.listingType === 'sale' && room.salePrice ? (
                                `${room.currencySymbol}${room.salePrice.toLocaleString()}`
                            ) : room.listingType === 'rent' && room.priceNight ? (
                                <>
                                    {room.currencySymbol}{room.priceNight}
                                    <span className="text-[9px] font-normal text-muted-foreground ml-0.5">/night</span>
                                </>
                            ) : room.listingType === 'rent' && room.priceMonth ? (
                                <>
                                    {room.currencySymbol}{room.priceMonth}
                                    <span className="text-[9px] font-normal text-muted-foreground ml-0.5">/month</span>
                                </>
                            ) : null}
                        </p>
                        <Badge variant={room.listingType === 'sale' ? 'default' : 'outline'} className="capitalize text-[8px] sm:text-[9px] py-0 px-2 h-5">{room.listingType}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-6 sm:mt-10 text-center">
            <Link
              href="/rooms"
              className={cn(buttonVariants({ size: "sm", className: "w-full sm:w-auto font-bold px-8 h-10" }))}
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
          'fixed bottom-6 right-6 h-12 w-12 sm:h-14 sm:w-14 shadow-lg z-40'
        )}
      >
        <Bot className="h-6 w-6 sm:h-7 sm:w-7" />
        <span className="sr-only">Chat with AI Support</span>
      </Link>
    </div>
  );
}
