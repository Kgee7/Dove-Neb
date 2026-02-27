
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from "next/navigation";
import { useCollection, useFirestore } from '@/firebase';
import { Room } from '@/lib/data';
import { useState, useMemo, useEffect } from 'react';
import { collection, query, where } from 'firebase/firestore';
import FavoriteButton from '@/components/favorite-button';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Rooms() {
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('loc') || '');
  const [listingTypeFilter, setListingTypeFilter] = useState(searchParams.get('type') || 'all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const roomsQuery = useMemo(() => {
    if (!firestore) return null;
    let q = query(collection(firestore, 'rooms'));
    if (listingTypeFilter !== 'all') {
      q = query(q, where('listingType', '==', listingTypeFilter));
    }
    return q;
  }, [firestore, listingTypeFilter]);
  
  const { data: rooms, isLoading } = useCollection<Room>(roomsQuery);

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    return rooms.filter(room => {
      const searchLower = searchQuery.toLowerCase();
      const locationLower = locationQuery.toLowerCase();
      
      const matchesSearch = searchQuery === '' || 
        (room.title && room.title.toLowerCase().includes(searchLower)) ||
        (room.description && room.description.toLowerCase().includes(searchLower));

      const matchesLocation = locationQuery === '' ||
        (room.location && room.location.toLowerCase().includes(locationLower)) ||
        (room.country && room.country.toLowerCase().includes(locationLower));

      return matchesSearch && matchesLocation;
    });
  }, [rooms, searchQuery, locationQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set('q', searchQuery); else params.delete('q');
    if (locationQuery) params.set('loc', locationQuery); else params.delete('loc');
    if (listingTypeFilter !== 'all') params.set('type', listingTypeFilter); else params.delete('type');
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div className="container py-8 sm:py-12 px-4">
      <div className="mb-8 sm:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-headline">
          Explore Spaces
        </h1>
        <p className="mt-3 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Find your next home away from home, or your next permanent residence.
        </p>
      </div>

       <Card className="mx-auto mb-8 sm:mb-12 max-w-4xl shadow-md">
          <CardContent className="p-3 sm:p-4">
            {isClient && (
              <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search destination..."
                    className="pl-9 h-10 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="City or country..." 
                    className="pl-9 h-10 text-sm"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={listingTypeFilter} onValueChange={setListingTypeFilter}>
                      <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="rent">For Rent</SelectItem>
                          <SelectItem value="sale">For Sale</SelectItem>
                      </SelectContent>
                  </Select>
                  <Button type="submit" className='w-full h-10 text-sm'>
                      Search
                  </Button>
                </div>
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
                <CardHeader className="p-0 relative">
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
                </CardHeader>
                <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="flex justify-between items-start mb-1 gap-2">
                        <CardTitle className="text-base sm:text-lg line-clamp-1">
                            <Link href={`/rooms/${room.id}`} className="hover:underline">
                                {room.title}
                            </Link>
                        </CardTitle>
                        {(room.interestCount !== undefined && room.interestCount > 0) ? (
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold shrink-0 bg-primary/5 px-1.5 py-0.5 rounded">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>5.0</span>
                                <span className="text-muted-foreground font-normal">({room.interestCount})</span>
                            </div>
                        ) : null}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
                        <span className="truncate">{room.location}, {room.country}</span>
                    </p>
                    <div className="mt-4 flex-grow" />
                     <div className="flex justify-between items-center mt-2">
                        <p className="text-base sm:text-lg font-bold text-primary">
                            {room.listingType === 'sale' && room.salePrice ? (
                                <>
                                    {room.currencySymbol}{room.salePrice.toLocaleString()}
                                </>
                            ) : room.listingType === 'rent' && room.priceNight ? (
                                <>
                                    {room.currencySymbol}{room.priceNight}
                                    <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5">/night</span>
                                </>
                            ) : room.priceMonth ? (
                                <>
                                    {room.currencySymbol}{room.priceMonth}
                                    <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5">/month</span>
                                </>
                            ) : 'Contact'}
                        </p>
                        <Badge variant={room.listingType === 'sale' ? 'default' : 'outline'} className="capitalize text-[10px] py-0 px-2 h-5">{room.listingType}</Badge>
                     </div>
                  </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-20 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground text-sm sm:text-base">No spaces found matching your criteria.</p>
              <Button variant="link" onClick={() => {
                  setSearchQuery('');
                  setLocationQuery('');
                  setListingTypeFilter('all');
                  router.push('/rooms');
              }}>Clear all filters</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
