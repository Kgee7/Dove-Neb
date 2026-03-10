
import { DocumentData, FirestoreDataConverter } from 'firebase/firestore';

// Basic data structures
export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  firstName?: string;
  lastName?: string;
}

export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    postedDate: Date;
}

export interface Room {
    id: string;
    listingType: 'rent' | 'sale';
    title: string;
    description: string;
    country: string;
    location: string;
    priceNight: number | null;
    priceMonth: number | null;
    salePrice: number | null;
    currency: string;
    currencySymbol: string;
    images: string[];
    amenities: string[];
    ownerName: string;
    ownerId: string;
    contactEmail: string | null;
    contactWhatsapp: string | null;
    interestCount?: number;
    listingStartDate?: string;
    listingEndDate?: string;
    status?: 'active' | 'pending_removal' | 'archived';
    removalDate?: any;
    createdAt?: any;
}

// Firestore data converters
export const roomConverter: FirestoreDataConverter<Room> = {
    toFirestore(room: Room): DocumentData {
        return { 
            listingType: room.listingType,
            title: room.title,
            description: room.description,
            country: room.country,
            location: room.location,
            priceNight: room.priceNight,
            priceMonth: room.priceMonth,
            salePrice: room.salePrice,
            currency: room.currency,
            currencySymbol: room.currencySymbol,
            images: room.images,
            amenities: room.amenities,
            ownerName: room.ownerName,
            ownerId: room.ownerId,
            contactEmail: room.contactEmail,
            contactWhatsapp: room.contactWhatsapp,
            interestCount: room.interestCount || 0,
            listingStartDate: room.listingStartDate || null,
            listingEndDate: room.listingEndDate || null,
            status: room.status || 'active',
            removalDate: room.removalDate || null,
            createdAt: room.createdAt || null,
        };
    },
    fromFirestore(snapshot, options): Room {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            listingType: data.listingType,
            title: data.title,
            description: data.description,
            country: data.country,
            location: data.location,
            priceNight: data.priceNight,
            priceMonth: data.priceMonth,
            salePrice: data.salePrice,
            currency: data.currency,
            currencySymbol: data.currencySymbol,
            images: data.images,
            amenities: data.amenities,
            ownerName: data.ownerName,
            ownerId: data.ownerId,
            contactEmail: data.contactEmail,
            contactWhatsapp: data.contactWhatsapp,
            interestCount: typeof data.interestCount === 'number' ? data.interestCount : 0,
            listingStartDate: data.listingStartDate,
            listingEndDate: data.listingEndDate,
            status: data.status,
            removalDate: data.removalDate,
            createdAt: data.createdAt,
        };
    },
};
