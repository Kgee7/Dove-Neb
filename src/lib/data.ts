
import { PlaceHolderImages } from "./placeholder-images";
import { collection, getDocs, getDoc, doc, getFirestore } from 'firebase/firestore';
import { initializeFirebase, addDocumentNonBlocking } from "@/firebase";

export type Job = {
  id: string;
  title: string;
  company: string;
  logoUrl: string;
  logoBg: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  workArrangement: 'On-site' | 'Remote' | 'Hybrid';
  salary: string;
  currency: string;
  currencySymbol: string;
  postedDate: string;
  category: 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'Product';
  description: string;
  requirements: string[];
  applicationEmail?: string;
  applicationWhatsApp?: string;
  closingDate: string;
  employerId: string;
};

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export let jobs: Job[] = [
  // This data is for seeding and reference. Actual data comes from Firestore.
];

async function seedJobs() {
    const { firestore } = initializeFirebase();
    const jobCollection = collection(firestore, 'jobListings');
    const jobSnapshot = await getDocs(jobCollection);
    if (jobSnapshot.empty) {
        console.log("Seeding jobs...");
        for (const job of jobs) {
            addDocumentNonBlocking(jobCollection, job);
        }
    }
}

if (typeof window !== 'undefined') {
    // seedJobs();
}
