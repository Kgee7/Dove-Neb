
'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { Room } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { DateRange } from "react-day-picker";
import { addDays, format, differenceInDays } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Wifi, Tv, Utensils, Wind, Star, CalendarIcon, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';


const amenityIcons: { [key: string]: React.ReactNode } = {
    'Wifi': <Wifi className="h-4 w-4" />,
    'TV': <Tv className="h-4 w-4" />,
    'Kitchen': <Utensils className="h-4 w-4" />,
    'Air Conditioning': <Wind className="h-4 w-4" />,
    'Heating': <Wind className="h-4 w-4" />,
    'Washer': <Star className="h-4 w-4" />,
    'Dryer': <Star className="h-4 w-4" />,
};


export default function RoomDetailsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  const roomDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'rooms', id);
  }, [firestore, id]);

  const { data: room, isLoading } = useDoc<Room>(roomDocRef);

  const handleBooking = async () => {
    if (!user || !room || !date?.from || !date?.to) {
        toast({
            variant: "destructive",
            title: "Booking Failed",
            description: "You must be logged in and select a valid date range to book a room.",
        });
        return;
    }
    setBookingLoading(true);
    try {
        const bookingsCollectionRef = collection(firestore, 'users', user.uid, 'bookings');
        const nights = differenceInDays(date.to, date.from);
        if (nights <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Date Range",
                description: "Check-out date must be after the check-in date.",
            });
            setBookingLoading(false);
            return;
        }

        await addDoc(bookingsCollectionRef, {
            roomId: room.id,
            renterId: user.uid,
            checkInDate: date.from,
            checkOutDate: date.to,
            totalPrice: (room.priceNight || 0) * nights,
            status: 'confirmed', // Or 'pending' if you want a confirmation step
            createdAt: serverTimestamp(),
            roomTitle: room.title,
            roomLocation: room.location,
            roomImage: room.images[0] || '',
        });

        toast({
            title: "Booking Successful!",
            description: `You have booked ${room.title}.`,
        });
        router.push('/dashboard');
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Booking Failed",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setBookingLoading(false);
    }
  }


  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-3xl font-bold">Room not found</h1>
        <p className="text-muted-foreground">This listing may have been removed or the link is incorrect.</p>
        <Link href="/rooms">
          <Button variant="link" className="mt-4">Back to all rooms</Button>
        </Link>
      </div>
    );
  }

  const nights = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;
  const totalCost = nights > 0 && room.priceNight ? room.priceNight * nights : 0;
  const ownerDisplayName = room.ownerName && room.ownerName.trim() !== 'undefined' ? `Hosted by ${room.ownerName}` : 'Hosted by a verified owner';

  return (
    <div className="bg-muted/40">
        <div className="container max-w-5xl py-12 mx-auto">
            <div className="mb-4">
                <Link href="/rooms" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to all rooms
                </Link>
            </div>

            <div>
                <h1 className="text-3xl font-bold font-headline mb-1">{room.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className='flex items-center gap-1'>
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-semibold">4.95</span>
                        <span className="underline">(120 reviews)</span>
                    </div>
                    <span>·</span>
                    <p>{room.location}</p>
                </div>
            </div>

            <Carousel className="w-full mt-6">
                <CarouselContent>
                    {room.images.map((img, index) => (
                    <CarouselItem key={index}>
                        <div className="relative aspect-video">
                        <Image
                            src={img}
                            alt={`${room.title} image ${index + 1}`}
                            fill
                            className="object-cover rounded-lg"
                        />
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                {room.images.length > 1 && (
                    <>
                        <CarouselPrevious className="ml-16" />
                        <CarouselNext className="mr-16" />
                    </>
                )}
            </Carousel>
            
            <div className="grid md:grid-cols-3 gap-8 mt-8">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold font-headline">{ownerDisplayName}</h2>
                    <Separator className="my-6" />
                    <div>
                        <h3 className="font-semibold text-xl mb-3">About this space</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{room.description}</p>
                    </div>
                    <Separator className="my-6" />
                    <div>
                        <h3 className="font-semibold text-xl mb-4">What this place offers</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {room.amenities.map(amenity => (
                                <div key={amenity} className="flex items-center gap-3">
                                    {amenityIcons[amenity] || <Star className="h-4 w-4" />}
                                    <span className="text-muted-foreground">{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-1">
                     <Card className="sticky top-24 shadow-lg">
                        <CardHeader>
                            {room.listingType === 'sale' && room.salePrice && (
                                <CardTitle className='text-2xl'>
                                    {room.currencySymbol}{room.salePrice.toLocaleString()}
                                </CardTitle>
                            )}
                            {room.listingType === 'rent' && (
                                <CardTitle className='text-2xl'>
                                    {room.priceNight ? `${room.currencySymbol}${room.priceNight.toLocaleString()}` : room.priceMonth ? `${room.currencySymbol}${room.priceMonth.toLocaleString()}`: 'Contact for price'}
                                    <span className="text-base font-normal text-muted-foreground">
                                        {room.priceNight ? '/night' : room.priceMonth ? '/month' : ''}
                                    </span>
                                </CardTitle>
                            )}
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {room.listingType === 'rent' && room.priceNight ? (
                                <>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date?.from ? (
                                            date.to ? (
                                                <>
                                                {format(date.from, "LLL dd, y")} -{" "}
                                                {format(date.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(date.from, "LLL dd, y")
                                            )
                                            ) : (
                                            <span>Pick a date</span>
                                            )}
                                        </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from}
                                            selected={date}
                                            onSelect={setDate}
                                            numberOfMonths={1}
                                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    {nights > 0 && totalCost > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>{room.currencySymbol}{room.priceNight} x {nights} nights</span>
                                                <span>{room.currencySymbol}{totalCost}</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between font-bold">
                                                <span>Total</span>
                                                <span>{room.currencySymbol}{totalCost}</span>
                                            </div>
                                        </div>
                                    )}

                                    <Button onClick={handleBooking} className="w-full" size="lg" disabled={bookingLoading}>
                                        {bookingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Book Now"}
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center mt-2">You won't be charged yet</p>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <h3 className='font-semibold'>Contact Information</h3>
                                    {room.contactPhone && (
                                        <a href={`tel:${room.contactPhone}`} className='w-full'>
                                            <Button variant="outline" className='w-full'>
                                                <Phone className='mr-2 h-4 w-4' /> Call
                                            </Button>
                                        </a>
                                    )}
                                    {room.contactWhatsapp && (
                                        <a href={`https://wa.me/${room.contactWhatsapp.replace(/\D/g, '')}`} target='_blank' rel='noopener noreferrer' className='w-full'>
                                            <Button variant="outline" className='w-full'>
                                                <MessageSquare className='mr-2 h-4 w-4' /> WhatsApp
                                            </Button>
                                        </a>
                                    )}
                                    {!room.contactPhone && !room.contactWhatsapp && (
                                        <p className="text-sm text-muted-foreground">Contact information not provided.</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                     </Card>
                </div>
            </div>

        </div>
    </div>
  );
}
