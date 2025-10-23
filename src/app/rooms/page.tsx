
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from "next/navigation";
import { useCollection, useFirestore } from '@/firebase';
import { Room } from '@/lib/data';
import { useState, useMemo } from 'react';
import { collection } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RoomsListingPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('loc') || '');

  const roomsQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'rooms');
  }, [firestore]);
  
  const { data: rooms, isLoading } = useCollection<Room>(roomsQuery);

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    return rooms.filter(room => {
      const searchLower = searchQuery.toLowerCase();
      const locationLower = locationQuery.toLowerCase();
      
      const matchesSearch = searchQuery === '' || 
        room.title.toLowerCase().includes(searchLower) ||
        room.description.toLowerCase().includes(searchLower);

      const matchesLocation = locationQuery === '' ||
        room.location.toLowerCase().includes(locationLower);

      return matchesSearch && matchesLocation;
    });
  }, [rooms, searchQuery, locationQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (locationQuery) params.set('loc', locationQuery);
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div className="container py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl font-headline">
          Explore Stays
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Find your next home away from home.
        </p>
      </div>

       <Card className="mx-auto mb-12 max-w-4xl shadow-lg">
          <CardContent className="p-4">
            <form className="flex flex-col gap-4 sm:flex-row" onSubmit={handleSearch}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Destination, e.g., 'beach house'"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Location, e.g., 'Paris'" 
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
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
                        <Badge variant="secondary">3 guests</Badge>
                     </div>
                  </CardContent>
              </Card>
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground py-16">
              No rooms found matching your criteria. Try broadening your search!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
