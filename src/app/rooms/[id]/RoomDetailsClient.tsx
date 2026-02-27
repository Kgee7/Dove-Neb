'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { Room } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import FavoriteButton from '@/components/favorite-button';
import ShareButton from '@/components/share-button';
import { v4 as uuidv4 } from 'uuid';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Wifi, Tv, Utensils, Wind, Star, Phone, MessageSquare, Maximize, Mail, Lock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";

const amenityIcons: { [key: string]: React.ReactNode } = {
    'Wifi': <Wifi className="h-4 w-4" />,
    'TV': <Tv className="h-4 w-4" />,
    'Kitchen': <Utensils className="h-4 w-4" />,
    'Air Conditioning': <Wind className="h-4 w-4" />,
    'Heating': <Wind className="h-4 w-4" />,
    'Washer': <Star className="h-4 w-4" />,
    'Dryer': <Star className="h-4 w-4" />,
};

interface RoomDetailsClientProps {
  id: string;
}

export default function RoomDetailsClient({ id }: RoomDetailsClientProps) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  
  const roomDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'rooms', id);
  }, [firestore, id]);

  const { data: room, isLoading } = useDoc<Room>(roomDocRef);

  const handleInterestClick = async () => {
    if (!user) {
        router.push(`/signup?redirect=${encodeURIComponent(pathname)}`);
        return;
    }

    if (!firestore || !room) return;

    try {
        const bookingId = uuidv4();
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const bookingData = {
            id: bookingId,
            roomId: room.id,
            roomTitle: room.title,
            roomLocation: `${room.location}, ${room.country}`,
            roomImage: room.images[0] || '',
            checkInDate: today,
            checkOutDate: tomorrow,
            totalPrice: room.priceNight || room.priceMonth || room.salePrice || 0,
            currencySymbol: room.currencySymbol || '$',
            status: 'pending',
            renterId: user.uid,
            createdAt: new Date(),
        };

        const bookingRef = doc(firestore, 'users', user.uid, 'bookings', bookingId);
        await setDoc(bookingRef, bookingData);

        await addDoc(collection(firestore, 'users', user.uid, 'notifications'), {
            id: uuidv4(),
            title: 'Interest Recorded',
            message: `You expressed interest in "${room.title}". The space has been added to your dashboard.`,
            type: 'info',
            read: false,
            createdAt: new Date()
        });

        setTimeout(async () => {
            await addDoc(collection(firestore, 'users', user.uid, 'notifications'), {
                id: uuidv4(),
                title: 'Quick Feedback',
                message: `How was the lodge today at "${room.title}"?`,
                type: 'survey',
                surveyQuestion: `How was the lodge today at "${room.title}"?`,
                surveyAnswer: null,
                roomId: room.id, 
                read: false,
                createdAt: new Date()
            });
        }, 5000);

        setShowContact(true);
        toast({
            title: "Interest Noted!",
            description: "Owner contact information revealed and space added to your dashboard.",
        });
    } catch (err: any) {
        console.error("Error creating interest booking:", err);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not record interest.' });
    }
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container py-12 text-center px-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Room not found</h1>
        <p className="text-sm text-muted-foreground mt-2">This listing may have been removed or the link is incorrect.</p>
        <Link href="/rooms">
          <Button variant="link" className="mt-4">Back to all rooms</Button>
        </Link>
      </div>
    );
  }

  const ownerDisplayName = room.ownerName && room.ownerName.trim() && !room.ownerName.includes('undefined')
    ? `Hosted by ${room.ownerName}` 
    : 'Hosted by a verified owner';

  return (
    <div className="bg-muted/40 min-h-screen">
        <div className="container max-w-5xl py-6 sm:py-12 mx-auto px-4">
            <div className="mb-4">
                <Link href="/rooms" className="inline-flex items-center text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                    Back to rooms
                </Link>
            </div>

            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-3xl font-bold font-headline mb-1 line-clamp-2">{room.title}</h1>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <p className="truncate">{room.location}, {room.country}</p>
                        </div>
                    </div>
                    {(room.interestCount !== undefined && room.interestCount > 0) ? (
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                            <div className="flex items-center gap-0.5 text-base sm:text-lg font-bold text-yellow-500">
                                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                                <span className="ml-1.5 text-foreground">5.0</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{room.interestCount} verified reviews</p>
                        </div>
                    ) : null}
                </div>
            </div>

            <Carousel className="w-full relative shadow-xl rounded-xl overflow-hidden bg-background">
                {room && <FavoriteButton item={room} itemType="room" />}
                {room && <ShareButton title={room.title} text={`Check out this space: ${room.title}`} className="absolute top-2 right-12 z-10 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 border-none text-white transition-colors" />}
                <CarouselContent>
                    {room.images.map((img, index) => (
                    <CarouselItem key={index}>
                        <div className="relative aspect-[4/3] sm:aspect-video cursor-pointer group" onClick={() => setSelectedImage(img)}>
                            <Image
                                src={img}
                                alt={`${room.title} image ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                            </div>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                {room.images.length > 1 && (
                    <>
                        <CarouselPrevious className="left-4 bg-background/80" />
                        <CarouselNext className="right-4 bg-background/80" />
                    </>
                )}
            </Carousel>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div className="md:col-span-2">
                    <h2 className="text-xl sm:text-2xl font-semibold font-headline">{ownerDisplayName}</h2>
                    <Separator className="my-6" />
                    <div>
                        <h3 className="font-semibold text-lg sm:text-xl mb-3">About this space</h3>
                        <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">{room.description}</p>
                    </div>
                    <Separator className="my-6" />
                    <div>
                        <h3 className="font-semibold text-lg sm:text-xl mb-4">Amenities</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {room.amenities.map(amenity => (
                                <div key={amenity} className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/5 rounded-full shrink-0">
                                        {amenityIcons[amenity] || <Star className="h-3.5 w-3.5" />}
                                    </div>
                                    <span className="text-xs sm:text-sm text-muted-foreground font-medium">{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-1">
                        <Card className="sticky top-24 shadow-xl border-primary/10 overflow-hidden">
                        <CardHeader className="bg-primary/[0.03] border-b p-4 sm:p-6">
                            {room.listingType === 'sale' && room.salePrice && (
                                <CardTitle className='text-xl sm:text-2xl font-bold'>
                                    {room.currencySymbol}{room.salePrice.toLocaleString()}
                                </CardTitle>
                            )}
                            {room.listingType === 'rent' && (
                                <CardTitle className='text-xl sm:text-2xl font-bold'>
                                    {room.priceNight ? `${room.currencySymbol}${room.priceNight.toLocaleString()}` : room.priceMonth ? `${room.currencySymbol}${room.priceMonth.toLocaleString()}`: 'Contact'}
                                    <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">
                                        {room.priceNight ? '/night' : room.priceMonth ? '/month' : ''}
                                    </span>
                                </CardTitle>
                            )}
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {!showContact ? (
                                <div className="space-y-4 text-center">
                                    <div className="flex justify-center">
                                        <div className="p-3 bg-muted rounded-full">
                                            <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-muted-foreground">Contact details are hidden for privacy</p>
                                    </div>
                                    <Button onClick={handleInterestClick} className="w-full h-11 sm:h-12 text-base sm:text-lg font-bold shadow-lg">
                                        I am Interested
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="space-y-3">
                                        <h3 className='font-bold text-[10px] sm:text-xs text-primary uppercase tracking-widest'>Contact Information</h3>
                                        <p className="text-[11px] sm:text-xs text-muted-foreground mb-4">Reach out to the owner directly to secure this space.</p>
                                        
                                        {room.contactEmail && (
                                            <a href={`mailto:${room.contactEmail}`} className='w-full'>
                                                <Button variant="outline" className='w-full group h-10 sm:h-11 text-xs sm:text-sm'>
                                                    <Mail className='mr-2 h-4 w-4 group-hover:text-primary transition-colors' /> Email Owner
                                                </Button>
                                            </a>
                                        )}
                                        {room.contactWhatsapp && (
                                            <a href={`https://wa.me/${room.contactWhatsapp.replace(/\D/g, '')}`} target='_blank' rel='noopener noreferrer' className='w-full block mt-2'>
                                                <Button variant="outline" className='w-full group h-10 sm:h-11 border-green-200 hover:bg-green-50 hover:border-green-300 text-xs sm:text-sm'>
                                                    <MessageSquare className='mr-2 h-4 w-4 text-green-600' /> WhatsApp Owner
                                                </Button>
                                            </a>
                                        )}
                                        {!room.contactEmail && !room.contactWhatsapp && (
                                            <p className="text-xs text-muted-foreground italic text-center py-4 bg-muted/30 rounded-md">No contact information provided.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        </Card>
                </div>
            </div>
        </div>

        <Dialog open={!!selectedImage} onOpenChange={(isOpen) => !isOpen && setSelectedImage(null)}>
            <DialogContent className="w-[95%] max-w-4xl max-h-[85vh] p-0 overflow-hidden bg-black rounded-lg border-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>View Room Image</DialogTitle>
                </DialogHeader>
                <div className="relative aspect-[4/3] sm:aspect-video w-full h-full">
                    {selectedImage && (
                        <Image
                            src={selectedImage}
                            alt="Full screen room image"
                            fill
                            className="object-contain"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
