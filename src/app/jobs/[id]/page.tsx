tsx
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

// NOTE: Replace this DUMMY_JOBS data with actual data fetched from your Firebase backend or API.
const DUMMY_JOBS = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'Tech Solutions Inc.',
    location: 'Remote',
    description: 'We are looking for a passionate Senior Frontend Developer to join our growing team. You will be responsible for developing and implementing user interface components using React.js workflows. Experience with Next.js and TypeScript is a plus.',
    requirements: ['5+ years React experience', 'Strong HTML/CSS/JS', 'Experience with REST APIs'],
    responsibilities: ['Build new features', 'Maintain existing codebase', 'Collaborate with UX/UI designers'],
    postedDate: '2025-10-15',
  },
  {
    id: '2',
    title: 'AI/ML Engineer',
    company: 'Innovate AI',
    location: 'San Francisco, CA',
    description: 'Join our cutting-edge AI team to develop and deploy machine learning models. You will work on various aspects of our AI platform, from data pipeline development to model optimization and deployment.',
    requirements: ['3+ years ML engineering', 'Python, TensorFlow/PyTorch', 'Cloud platforms (AWS/GCP/Azure)'],
    responsibilities: ['Design and implement ML models', 'Optimize model performance', 'Integrate models into production systems'],
    postedDate: '2025-10-20',
  },
  // Add more dummy job data or integrate with your actual data source
];

// Function to fetch job details (IMPORTANT: Replace with your actual API call or Firebase data fetching logic)
async function getJobDetails(jobId: string) {
  // Example for fetching from an API endpoint:
  // const response = await fetch(`/api/jobs/${jobId}`);
  // if (!response.ok) {
  //   return null; // Or throw an error
  // }
  // return response.json();

  // For now, using dummy data:
  return DUMMY_JOBS.find(job => job.id === jobId);
}

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const jobId = params.id;
  const job = await getJobDetails(jobId);

  if (!job) {
    notFound(); // This will show a 404 page if the job is not found
  }

  return (
    <div className="container max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{job.title}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">{job.company} - {job.location}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-xl mb-2">Job Description</h4>
            <p className="text-gray-700 dark:text-gray-300">{job.description}</p>
          </div>
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h4 className="font-semibold text-xl mb-2">Requirements</h4>
              <ul className="list-disc list-inside space-y-1">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div>
              <h4 className="font-semibold text-xl mb-2">Responsibilities</h4>
              <ul className="list-disc list-inside space-y-1">
                {job.responsibilities.map((res, index) => (
                  <li key={index}>{res}</li>
                ))}
              </ul>
            </div>
          )}
          {job.postedDate && (
            <p className="text-sm text-muted-foreground">Posted on: {job.postedDate}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end pt-6">
          {/* Example of an apply button */}
          <Link href={`/apply/${job.id}`}>
            <Button size="lg">Apply Now</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
