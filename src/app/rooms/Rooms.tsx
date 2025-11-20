
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
import { MapPin, Loader2, Search } from 'lucide-react';
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
    <div className="container py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl font-headline">
          Explore Spaces
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Find your next home away from home, or your next home.
        </p>
      </div>

       <Card className="mx-auto mb-12 max-w-4xl shadow-lg">
          <CardContent className="p-4">
            {isClient && (
              <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" onSubmit={handleSearch}>
                <div className="relative lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Destination, e.g., 'beach house'"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative lg:col-span-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Location, e.g., 'Paris'" 
                    className="pl-10"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={listingTypeFilter} onValueChange={setListingTypeFilter}>
                      <SelectTrigger>
                          <SelectValue placeholder="Listing Type" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="rent">For Rent</SelectItem>
                          <SelectItem value="sale">For Sale</SelectItem>
                      </SelectContent>
                  </Select>
                  <Button type="submit" className='w-full'>
                      Search
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <Card
                key={room.id}
                className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-2xl group"
              >
                <CardHeader className="p-0 relative">
                    <FavoriteButton item={room} itemType="room" />
                    <Link href={`/rooms/${room.id}`}>
                        <div className="relative aspect-video overflow-hidden">
                            <Image
                                src={room.images[0] || "/placeholder.jpg"}
                                alt={room.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
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
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground py-16">
              No spaces found matching your criteria. Try broadening your search!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
