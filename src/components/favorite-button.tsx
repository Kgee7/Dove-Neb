
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, doc, setDoc, deleteDoc, getDoc } from '@/firebase';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Room } from '@/lib/data';
import { Job } from '@/lib/job-data';

type FavoriteButtonProps = {
  item: Room | Job;
  itemType: 'room' | 'job';
};

export default function FavoriteButton({ item, itemType }: FavoriteButtonProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const favoriteDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    const collectionName = itemType === 'job' ? 'favoriteJobs' : 'favoriteRooms';
    return doc(firestore, 'users', user.uid, collectionName, item.id);
  }, [user, firestore, item.id, itemType]);

  useEffect(() => {
    if (!favoriteDocRef) {
      setIsLoading(false);
      return;
    }

    const checkFavorite = async () => {
      try {
        const docSnap = await getDoc(favoriteDocRef);
        setIsFavorited(docSnap.exists());
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFavorite();
    // No real-time listener here to avoid too many reads on list pages.
    // The state is only checked on mount.
  }, [favoriteDocRef]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the button on a card
    e.stopPropagation();

    if (!user || !firestore || !favoriteDocRef) {
      toast({
        variant: 'destructive',
        title: 'Please log in',
        description: 'You need to be logged in to save favorites.',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorited) {
        // Remove from favorites
        await deleteDoc(favoriteDocRef);
        setIsFavorited(false);
        toast({ title: 'Removed from Favorites' });
      } else {
        // Add to favorites
        let dataToSet;
        if (itemType === 'job') {
            const job = item as Job;
            dataToSet = {
                jobId: job.id,
                title: job.title,
                companyName: job.companyName,
                location: job.location,
                country: job.country || '',
                addedAt: new Date(),
            };
        } else {
            const room = item as Room;
            dataToSet = {
                roomId: room.id,
                title: room.title,
                location: room.location,
                country: room.country,
                image: room.images[0] || '',
                addedAt: new Date(),
            };
        }
        await setDoc(favoriteDocRef, dataToSet);
        setIsFavorited(true);
        toast({ title: 'Added to Favorites' });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update your favorites.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white hover:text-white"
      onClick={handleFavoriteToggle}
      disabled={isLoading}
    >
      <Heart className={cn('h-5 w-5', isFavorited && 'fill-red-500 text-red-500')} />
    </Button>
  );
}
