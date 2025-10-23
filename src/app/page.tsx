
'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  BedDouble,
  Home,
  Search,
  Users,
  MapPin,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';

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
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const heroImage = PlaceHolderImages.find(
    (img) => img.id === "hero-background"
  );
  
  const firestore = useFirestore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const roomsQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'rooms');
  }, [firestore]);
  
  const { data: rooms, isLoading } = useCollection<Room>(roomsQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (locationQuery) params.set('loc', locationQuery);
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full">
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
              Find Your Next Perfect Stay
            </h1>
            <p className="mt-4 text-lg text-foreground/90 md:text-xl">
              Discover unique rooms and experiences, curated for you.
            </p>
            <Card className="mx-auto mt-8 max-w-2xl shadow-lg">
              <CardContent className="p-4">
                <form className="flex flex-col gap-4 sm:flex-row" onSubmit={handleSearch}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search destinations"
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Location" 
                      className="pl-10"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="bg-accent hover:bg-accent/90">
                    Search
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-16 sm:py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle>For Renters</CardTitle>
                <CardDescription>Find your home away from home.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Browse through thousands of unique listings to find the perfect space for your next trip. Securely book and communicate with hosts.
              </p>
            </CardContent>
          </Card>
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-full bg-accent/10 p-3">
                <Home className="h-8 w-8 text-accent" />
              </div>
              <div>
                <CardTitle>For Owners</CardTitle>
                <CardDescription>Share your space, earn income.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                List your room, manage bookings, and connect with travelers from around the world. Our platform makes hosting simple and rewarding.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="bg-secondary/50 py-16 sm:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl font-headline">
              Featured Stays
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Explore some of our most popular and highly-rated rooms.
            </p>
          </div>
          {isLoading ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms?.slice(0, 6).map((room) => (
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
