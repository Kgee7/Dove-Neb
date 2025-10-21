import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, MapPin, Building, Share2, Heart } from "lucide-react";

import { jobs } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);
  const headerImage = PlaceHolderImages.find((img) => img.id === "job-detail-header");

  if (!job) {
    notFound();
  }

  return (
    <div>
      <div className="relative h-48 w-full">
        {headerImage && (
          <Image
            src={headerImage.imageUrl}
            alt={headerImage.description}
            data-ai-hint={headerImage.imageHint}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="container -mt-24 pb-16">
        <div className="relative">
          <Link href="/jobs" className={cn("absolute -top-12 left-0 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-primary-foreground/80 transition-colors")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col items-start gap-6 p-6 sm:flex-row">
              <div className={cn("flex h-20 w-20 shrink-0 items-center justify-center rounded-lg sm:h-24 sm:w-24", job.logoBg)}>
                <Image
                  src={job.logoUrl}
                  alt={`${job.company} logo`}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-md object-contain sm:h-20 sm:w-20"
                />
              </div>
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2">{job.category}</Badge>
                <h1 className="text-2xl font-bold md:text-3xl font-headline">{job.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{job.type}</span>
                  </div>
                </div>
                 <p className="mt-3 text-lg font-semibold text-primary">{job.salary}</p>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                <Link href={`/jobs/apply/${job.id}`} className="w-full sm:w-auto">
                    <Button className="w-full bg-accent hover:bg-accent/90">Apply Now</Button>
                </Link>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon"><Heart className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-12 p-6 pt-0 md:grid-cols-3">
              <div className="space-y-8 md:col-span-2">
                <div>
                  <h2 className="text-xl font-semibold mb-4 font-headline">Job Description</h2>
                  <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4 font-headline">Requirements</h2>
                  <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-headline">About {job.company}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {job.company} is a leading innovator in the tech industry, committed to creating solutions that change the world. Join our dynamic team and make an impact.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-headline">Job Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">Posted:</span>
                            <span>{job.postedDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">Location:</span>
                            <span>{job.location}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">Job Type:</span>
                            <span>{job.type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">Salary:</span>
                            <span className="text-right">{job.salary}</span>
                        </div>
                    </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
