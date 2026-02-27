import { Metadata } from 'next';
import { getJob } from '@/app/rooms/[id]/actions';
import JobDetailsClient from './JobDetailsClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  
  if (!job) {
    return {
      title: 'Job Not Found | Dove Neb',
    };
  }

  return {
    title: `${job.title} at ${job.companyName} | Dove Neb`,
    description: job.description.substring(0, 160) + '...',
    openGraph: {
      title: `${job.title} | ${job.companyName}`,
      description: job.description.substring(0, 160) + '...',
      type: 'website',
      siteName: 'Dove Neb',
    },
    twitter: {
      card: 'summary_large_image',
      title: job.title,
      description: job.description.substring(0, 160) + '...',
    }
  };
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobDetailsClient id={id} />;
}
