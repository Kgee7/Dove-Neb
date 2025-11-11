
import { collection, query, getDocs, where, DocumentData, FirestoreDataConverter } from 'firebase/firestore';
import { firestore } from '@/firebase';

// Basic data structures
export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  // Add any other user-specific fields you need
}

export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    postedDate: Date;
    // Add other relevant job fields
}

export interface Room {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    currencySymbol: string;
    location: string;
    images: string[];
    amenities: string[];
    ownerName: string;
    ownerId: string;
}

// Firestore data converters
export const roomConverter: FirestoreDataConverter<Room> = {
    toFirestore(room: Room): DocumentData {
        return { 
            title: room.title,
            description: room.description,
            price: room.price,
            currency: room.currency,
            currencySymbol: room.currencySymbol,
            location: room.location,
            images: room.images,
            amenities: room.amenities,
            ownerName: room.ownerName,
            ownerId: room.ownerId,
        };
    },
    fromFirestore(snapshot, options): Room {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            title: data.title,
            description: data.description,
            price: data.price,
            currency: data.currency,
            currencySymbol: data.currencySymbol,
            location: data.location,
            images: data.images,
            amenities: data.amenities,
            ownerName: data.ownerName,
            ownerId: data.ownerId,
        };
    },
};

    