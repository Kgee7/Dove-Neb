tsx
// src/app/jobs/page.tsx (example file where your job listings might be)
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming these components exist

// NOTE: Replace this DUMMY_JOBS data with actual data fetched from your Firebase backend or API.
const DUMMY_JOBS = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'Tech Solutions Inc.',
    location: 'Remote',
    description: 'Develop user interface components using React.js workflows.',
  },
  {
    id: '2',
    title: 'AI/ML Engineer',
    company: 'Innovate AI',
    location: 'San Francisco, CA',
    description: 'Develop and deploy machine learning models.',
  },
  {
    id: '3',
    title: 'UX/UI Designer',
    company: 'Creative Studio',
    location: 'New York, NY',
    description: 'Design intuitive and engaging user experiences.',
  },
];

export default function JobsListingPage() {
  const jobs = DUMMY_JOBS; // IMPORTANT: In reality, fetch jobs from an API or database

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Browse Job Openings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            // Wrap the entire card in a Next.js Link component
            <Link key={job.id} href={`/jobs/${job.id}`} passHref>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  <CardDescription>{job.company} - {job.location}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{job.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No jobs found. Check back later!</p>
        )}
      </div>
    </div>
  );
}
