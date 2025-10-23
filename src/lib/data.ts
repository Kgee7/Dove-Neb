
import { PlaceHolderImages } from "./placeholder-images";
import { collection, getDocs, getDoc, doc, getFirestore, setDoc } from 'firebase/firestore';
import { initializeFirebase } from "@/firebase/init";

export type Room = {
  id: string;
  title: string;
  ownerName: string;
  location: string;
  price: number;
  currency: string;
  currencySymbol: string;
  images: string[];
  amenities: string[];
  description: string;
  ownerId: string;
};

// This is mock data for seeding purposes
export const rooms: Room[] = [
  // This data is for seeding and reference. Actual data comes from Firestore.
];

async function seedRooms() {
    const { firestore } = initializeFirebase();
    const roomCollection = collection(firestore, 'rooms');
    const roomSnapshot = await getDocs(roomCollection);
    if (roomSnapshot.empty) {
        console.log("Seeding rooms...");
        for (const room of rooms) {
            const roomDocRef = doc(roomCollection, room.id);
            await setDoc(roomDocRef, room);
        }
    }
}

if (typeof window !== 'undefined') {
    // seedRooms();
}
