
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { Room } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import FavoriteButton from '@/components/favorite-button';
import ShareButton from '@/components/share-button';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Wifi, Tv, Utensils, Wind, Star, Phone, MessageSquare, Maximize, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

export default function RoomDetailsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const id = params.id as string;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [isRating, setIsRating] = useState(false);
  
  const roomDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'rooms', id);
  }, [firestore, id]);

  const { data: room, isLoading } = useDoc<Room>(roomDocRef);

  // Check if user has already rated (expressed interest) to reveal contact info automatically
  useEffect(() => {
    if (!user || !firestore || !id) return;
    
    const checkInterest = async () => {
        const ratingRef = doc(firestore, 'rooms', id, 'ratings', user.uid);
        const snap = await getDoc(ratingRef);
        if (snap.exists()) {
            setShowContact(true);
        }
    };
    checkInterest();
  }, [user, firestore, id]);

  const handleInterestClick = async () => {
    if (!user) {
        router.push(`/signup?redirect=${encodeURIComponent(pathname)}`);
        return;
    }

    if (!firestore || !id) return;

    setIsRating(true);
    try {
        // Create a rating entry to track interest
        const ratingRef = doc(firestore, 'rooms', id, 'ratings', user.uid);
        await setDoc(ratingRef, {
            userId: user.uid,
            userName: user.displayName || 'Anonymous User',
            timestamp: serverTimestamp(),
            type: 'interest'
        }, { merge: true });

        setShowContact(true);
        toast({
            title: "Interest Noted!",
            description: "Owner contact information revealed. You can now reach out.",
        });
    } catch (error: any) {
        console.error("Error recording interest:", error);
        toast({
            variant: "destructive",
            title: "Action Failed",
            description: "Could not record your interest. Please try again."
        });
    } finally {
        setIsRating(false);
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
      <div className="container py-12 text-center">
        <h1 className="text-3xl font-bold">Room not found</h1>
        <p className="text-muted-foreground">This listing may have been removed or the link is incorrect.</p>
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
    <div className="bg-muted/40">
        <Dialog open={!!selectedImage} onOpenChange={(isOpen) => !isOpen && setSelectedImage(null)}>
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
                            <span className="font-semibold">New</span>
                        </div>
                        <span>·</span>
                        <p>{room.location}, {room.country}</p>
                    </div>
                </div>

                <Carousel className="w-full mt-6 relative">
                    {room && <FavoriteButton item={room} itemType="room" />}
                    {room && <ShareButton title={room.title} text={`Check out this space: ${room.title}`} className="absolute top-2 right-12 z-10 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 border-none text-white hover:text-white" />}
                    <CarouselContent>
                        {room.images.map((img, index) => (
                        <CarouselItem key={index}>
                            <div className="relative aspect-video cursor-pointer group" onClick={() => setSelectedImage(img)}>
                                <Image
                                    src={img}
                                    alt={`${room.title} image ${index + 1}`}
                                    fill
                                    className="object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Maximize className="h-10 w-10 text-white" />
                                </div>
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
                            <h3 className="font-semibold text-xl mb-3">About {room.title}</h3>
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
                         <Card className="sticky top-24 shadow-lg overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b">
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
                            <CardContent className="p-6">
                                {!showContact ? (
                                    <div className="space-y-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="p-3 bg-muted rounded-full">
                                                <Lock className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">click the button to contact the owner</p>
                                        </div>
                                        <Button onClick={handleInterestClick} className="w-full h-12 text-lg font-semibold" disabled={isRating}>
                                            {isRating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                            I am Interested
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="space-y-3">
                                            <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wider'>Contact the Owner</h3>
                                            <p className="text-xs text-muted-foreground mb-4">You have expressed interest in this space. Reach out directly to discuss availability.</p>
                                            
                                            {room.contactEmail && (
                                                <a href={`mailto:${room.contactEmail}`} className='w-full'>
                                                    <Button variant="outline" className='w-full group h-11'>
                                                        <Mail className='mr-2 h-4 w-4 group-hover:text-primary transition-colors' /> Email Owner
                                                    </Button>
                                                </a>
                                            )}
                                            {room.contactWhatsapp && (
                                                <a href={`https://wa.me/${room.contactWhatsapp.replace(/\D/g, '')}`} target='_blank' rel='noopener noreferrer' className='w-full block mt-2'>
                                                    <Button variant="outline" className='w-full group h-11 border-green-200 hover:bg-green-50 hover:border-green-300'>
                                                        <MessageSquare className='mr-2 h-4 w-4 text-green-600' /> WhatsApp Owner
                                                    </Button>
                                                </a>
                                            )}
                                            {!room.contactEmail && !room.contactWhatsapp && (
                                                <p className="text-sm text-muted-foreground italic">Contact information not provided for this listing.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                         </Card>
                    </div>
                </div>

            </div>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <div className="relative aspect-video">
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
