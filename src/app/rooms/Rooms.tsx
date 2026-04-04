'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from "next/navigation";
import { useCollection, useFirestore } from '@/firebase';
import { Room } from '@/lib/data';
import { useState, useMemo, useEffect } from 'react';
import { collection, query, where, limit } from 'firebase/firestore';
import FavoriteButton from '@/components/favorite-button';
import { isWithinInterval, parseISO } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Search, Star, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Rooms() {
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [locationTerm, setLocationTerm] = useState(searchParams.get('l') || '');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const roomsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'rooms'), where('status', '==', 'active'), limit(100));
  }, [firestore]);
  
  const { data: rooms, isLoading } = useCollection<Room>(roomsQuery);

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    const today = new Date();

    return rooms.filter(room => {
      const searchLower = searchTerm.toLowerCase();
      const locLower = locationTerm.toLowerCase();
      
      const matchesSearch = searchTerm === '' || 
        (room.title && room.title.toLowerCase().includes(searchLower)) ||
        (room.description && room.description.toLowerCase().includes(searchLower));

      const matchesLocation = locationTerm === '' ||
        (room.location && room.location.toLowerCase().includes(locLower)) ||
        (room.country && room.country.toLowerCase().includes(locLower));

      // Expiry filtering for sales
      let dateMatch = true;
      if (room.listingType === 'sale' && room.listingStartDate && room.listingEndDate) {
          try {
              dateMatch = isWithinInterval(today, {
                  start: parseISO(room.listingStartDate),
                  end: parseISO(room.listingEndDate)
              });
          } catch (e) {
              dateMatch = true;
          }
      }

      return matchesSearch && matchesLocation && dateMatch && room.status === 'active';
    });
  }, [rooms, searchTerm, locationTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (locationTerm) params.set('l', locationTerm);
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div className="container py-8 sm:py-12 px-4">
      <div className="mb-8 sm:mb-12 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-headline">
          Lodge Now
        </h1>
        <p className="mt-2 text-[10px] sm:text-xs md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Find your next home away from home, or your next permanent residence.
        </p>
      </div>

       <Card className="mx-auto mb-8 sm:mb-12 max-w-2xl shadow-md bg-background/95 backdrop-blur-sm border-none overflow-hidden">
          <CardContent className="p-1 sm:p-1.5">
            {isClient && (
              <form className="flex items-center gap-1" onSubmit={handleSearch}>
                <div className="flex flex-1 items-center bg-muted/30 rounded-md sm:rounded-full border focus-within:ring-1 focus-within:ring-primary overflow-hidden h-8 sm:h-9">
                  <div className="flex flex-1 items-center px-2 border-r border-muted-foreground/20 h-full">
                    <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="Space type"
                      className="border-none bg-transparent focus-visible:ring-0 h-full text-[10px] sm:text-xs px-2"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-1 items-center px-2 h-full">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="Location"
                      className="border-none bg-transparent focus-visible:ring-0 h-full text-[10px] sm:text-xs px-2"
                      value={locationTerm}
                      onChange={(e) => setLocationTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className='h-8 sm:h-9 px-5 rounded-md sm:rounded-full font-bold shrink-0 text-[10px] sm:text-xs'>
                    Search
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <Card
                key={room.id}
                className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl group border-muted/50"
              >
                <div className="p-0 relative">
                    <FavoriteButton item={room} itemType="room" />
                    <Link href={`/rooms/${room.id}`}>
                        <div className="relative aspect-video overflow-hidden">
                            <Image
                                src={room.images[0] || "/placeholder.jpg"}
                                alt={room.title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    </Link>
                </div>
                <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="flex justify-between items-start mb-1 gap-2">
                        <CardTitle className="text-sm sm:text-lg line-clamp-1">
                            <Link href={`/rooms/${room.id}`} className="hover:underline">
                                {room.title}
                            </Link>
                        </CardTitle>
                        {(room.interestCount !== undefined && room.interestCount > 0) ? (
                            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold shrink-0 bg-primary/5 px-1.5 py-0.5 rounded">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>5.0</span>
                            </div>
                        ) : null}
                    </div>
                    <p className="text-[10px] sm:text-sm text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
                        <span className="truncate">{room.location}, {room.country}</span>
                    </p>
                    <div className="mt-4 flex-grow" />
                     <div className="flex justify-between items-center mt-2 pt-3 border-t">
                        <p className="text-sm sm:text-lg font-bold text-primary">
                            {room.listingType === 'sale' && room.salePrice ? (
                                <>
                                    {room.currencySymbol}{room.salePrice.toLocaleString()}
                                </>
                            ) : room.listingType === 'rent' && room.priceNight ? (
                                <>
                                    {room.currencySymbol}{room.priceNight}
                                    <span className="text-[9px] sm:text-[10px] font-normal text-muted-foreground ml-0.5">/night</span>
                                </>
                            ) : room.priceMonth ? (
                                <>
                                    {room.currencySymbol}{room.priceMonth}
                                    <span className="text-[9px] sm:text-[10px] font-normal text-muted-foreground ml-0.5">/month</span>
                                </>
                            ) : 'Contact'}
                        </p>
                        <Badge variant={room.listingType === 'sale' ? 'default' : 'outline'} className="capitalize text-[8px] sm:text-[9px] py-0 px-2 h-5">
                          {room.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                        </Badge>
                     </div>
                  </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-20 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground text-[10px] sm:text-base">No Lodge Now found matching your criteria.</p>
              <Button variant="link" size="sm" onClick={() => {
                  setSearchTerm('');
                  setLocationTerm('');
                  router.push('/rooms');
              }}>Clear all filters</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
