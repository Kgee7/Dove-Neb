
import { Metadata } from 'next';
import { getJob } from '@/app/rooms/[id]/actions';
import JobDetailsClient from './JobDetailsClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  // Safely attempt to fetch job data
  const job = await getJob(id);
  
  if (!job) {
    return {
      title: 'Job Details | Dove Neb',
      description: 'Explore this career opportunity on Dove Neb - Where Opportunities Take Flight.',
    };
  }

  const salaryInfo = job.salaryMin && job.salaryMax 
    ? `${job.salaryCurrencySymbol}${job.salaryMin.toLocaleString()} - ${job.salaryCurrencySymbol}${job.salaryMax.toLocaleString()} / ${job.salaryPeriod}`
    : 'Competitive Salary';

  // Use a professional placeholder for job listings
  const shareImage = "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1000&auto=format&fit=crop";

  return {
    title: `${job.title} at ${job.companyName} | Dove Neb`,
    description: `${job.companyName} is hiring in ${job.location}. ${job.type} role. Salary: ${salaryInfo}.`,
    openGraph: {
      title: `${job.title} at ${job.companyName}`,
      description: `${job.companyName} is hiring in ${job.location}. ${job.type} role. ${salaryInfo}.`,
      type: 'website',
      siteName: 'Dove Neb',
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: job.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: job.title,
      description: job.description.substring(0, 160) + '...',
      images: [shareImage],
    }
  };
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobDetailsClient id={id} />;
}
