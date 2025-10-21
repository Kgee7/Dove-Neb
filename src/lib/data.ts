import { PlaceHolderImages } from "./placeholder-images";
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { initializeFirebase, addDocumentNonBlocking } from "@/firebase";

export type Job = {
  id: string;
  title: string;
  company: string;
  logoUrl: string;
  logoBg: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  salary: string;
  postedDate: string;
  category: 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'Product';
  description: string;
  requirements: string[];
  applicationEmail?: string;
  applicationWhatsApp?: string;
  closingDate: string;
};

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export let jobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'Innovate Inc.',
    logoUrl: findImage('company-logo-1'),
    logoBg: 'bg-indigo-100',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120,000 - $160,000',
    postedDate: '2d ago',
    category: 'Engineering',
    description: 'We are looking for a seasoned Frontend Developer to build and maintain our web applications. You will be responsible for creating a top-tier user experience.',
    requirements: ['5+ years of experience with React', 'Expertise in TypeScript, HTML, and CSS', 'Experience with GraphQL', 'Strong understanding of web performance'],
    closingDate: '2025-12-31',
  },
  {
    id: '2',
    title: 'Product Designer',
    company: 'Creative Co.',
    logoUrl: findImage('company-logo-2'),
    logoBg: 'bg-pink-100',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$90,000 - $130,000',
    postedDate: '4d ago',
    category: 'Design',
    description: 'Join our team to design beautiful and intuitive interfaces for our suite of creative tools. You will work closely with product managers and engineers.',
    requirements: ['Proven experience as a Product Designer', 'Strong portfolio of design projects', 'Proficiency in Figma or Sketch', 'Excellent communication skills'],
    closingDate: '2025-12-31',
  },
  {
    id: '3',
    title: 'Digital Marketing Manager',
    company: 'Growth Gurus',
    logoUrl: findImage('company-logo-3'),
    logoBg: 'bg-green-100',
    location: 'Remote',
    type: 'Full-time',
    salary: '$85,000 - $110,000',
    postedDate: '1w ago',
    category: 'Marketing',
    description: 'We are seeking a results-driven Digital Marketing Manager to lead our online marketing efforts, including SEO/SEM, email marketing, and social media campaigns.',
    requirements: ['5+ years in digital marketing', 'Experience with Google Analytics and AdWords', 'Strong analytical skills', 'Proven track record of successful campaigns'],
    closingDate: '2025-12-31',
  },
  {
    id: '4',
    title: 'Backend Engineer (Node.js)',
    company: 'Tech Solutions',
    logoUrl: findImage('company-logo-4'),
    logoBg: 'bg-purple-100',
    location: 'Austin, TX',
    type: 'Contract',
    salary: '$70 - $90 / hour',
    postedDate: '3d ago',
    category: 'Engineering',
    description: 'Seeking a Backend Engineer to develop and manage our server-side logic. You will be responsible for the core services that power our applications.',
    requirements: ['3+ years of experience with Node.js', 'Experience with RESTful APIs and microservices', 'Knowledge of databases like PostgreSQL or MongoDB', 'Familiarity with AWS or GCP'],
    closingDate: '2025-12-31',
  },
  {
    id: '5',
    title: 'Account Executive',
    company: 'SalesForce',
    logoUrl: findImage('company-logo-5'),
    logoBg: 'bg-blue-100',
    location: 'Chicago, IL',
    type: 'Full-time',
    salary: '$75,000 + Commission',
    postedDate: '5d ago',
    category: 'Sales',
    description: 'We are looking for a motivated Account Executive to drive sales and build strong relationships with clients. You will manage the full sales cycle.',
    requirements: ['2+ years of B2B sales experience', 'Excellent negotiation and communication skills', 'Track record of meeting or exceeding sales quotas', 'Familiarity with CRM software'],
    closingDate: '2025-12-31',
  },
  {
    id: '6',
    title: 'UX Researcher',
    company: 'UserFirst Labs',
    logoUrl: findImage('company-logo-6'),
    logoBg: 'bg-yellow-100',
    location: 'Remote',
    type: 'Part-time',
    salary: '$40 - $60 / hour',
    postedDate: '10d ago',
    category: 'Design',
    description: 'Join our research team to uncover user needs and behaviors. Your insights will directly shape product strategy and design decisions.',
    requirements: ['Experience with qualitative and quantitative research methods', 'Ability to synthesize research findings into actionable insights', 'Strong empathy for users', 'Excellent collaboration skills'],
    closingDate: '2025-12-31',
  },
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

// Check if we are in a browser environment before seeding
if (typeof window !== 'undefined') {
    seedJobs();
}

export async function getJobs(): Promise<Job[]> {
    const { firestore } = initializeFirebase();
    const jobCollection = collection(firestore, 'jobListings');
    const jobSnapshot = await getDocs(jobCollection);
    const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
    return jobList;
}

export async function getJob(id: string): Promise<Job | undefined> {
  const jobs = await getJobs();
  return jobs.find(job => job.id === id);
}

    