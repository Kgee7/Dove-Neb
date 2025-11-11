
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
    listingType: 'rent' | 'sale';
    title: string;
    description: string;
    priceNight: number | null;
    priceMonth: number | null;
    salePrice: number | null;
    currency: string;
    currencySymbol: string;
    location: string;
    images: string[];
    amenities: string[];
    ownerName: string;
    ownerId: string;
    contactPhone: string | null;
    contactWhatsapp: string | null;
}

// Firestore data converters
export const roomConverter: FirestoreDataConverter<Room> = {
    toFirestore(room: Room): DocumentData {
        return { 
            listingType: room.listingType,
            title: room.title,
            description: room.description,
            priceNight: room.priceNight,
            priceMonth: room.priceMonth,
            salePrice: room.salePrice,
            currency: room.currency,
            currencySymbol: room.currencySymbol,
            location: room.location,
            images: room.images,
            amenities: room.amenities,
            ownerName: room.ownerName,
            ownerId: room.ownerId,
            contactPhone: room.contactPhone,
            contactWhatsapp: room.contactWhatsapp,
        };
    },
    fromFirestore(snapshot, options): Room {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            listingType: data.listingType,
            title: data.title,
            description: data.description,
            priceNight: data.priceNight,
            priceMonth: data.priceMonth,
            salePrice: data.salePrice,
            currency: data.currency,
            currencySymbol: data.currencySymbol,
            location: data.location,
            images: data.images,
            amenities: data.amenities,
            ownerName: data.ownerName,
            ownerId: data.ownerId,
            contactPhone: data.contactPhone,
            contactWhatsapp: data.contactWhatsapp,
        };
    },
};
