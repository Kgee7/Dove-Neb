import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Mail, MessageCircle } from 'lucide-react';
import { getJob } from '@/lib/jobs';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="bg-muted/40">
        <div className="container max-w-4xl py-12">
            <Card className="overflow-hidden">
                <CardHeader className="p-0">
                    <div className={cn("flex items-center gap-6 p-6", job.logoBg || 'bg-secondary')}>
                         <div className={cn("flex h-20 w-20 shrink-0 items-center justify-center rounded-lg", job.logoBg || 'bg-secondary')}>
                            <Image
                                src={job.logoUrl}
                                alt={`${job.company} logo`}
                                width={60}
                                height={60}
                                className="rounded-md object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
                            <CardTitle className="text-3xl font-bold font-headline">{job.title}</CardTitle>
                        </div>
                    </div>
                     <div className="border-t p-4 sm:p-6 flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline">{job.type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge variant="outline" className="flex items-center gap-1">
                                {job.workArrangement === 'Remote' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                {job.location}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                           <p className="font-semibold text-base">{job.currencySymbol}{job.salary}</p>
                           <p className="text-muted-foreground">({job.currency})</p>
                        </div>
                        <div className="ml-auto text-sm text-muted-foreground">
                            Posted on {job.postedDate}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 p-4 sm:p-6">
                <div>
                    <h4 className="font-semibold text-xl mb-2">Job Description</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>
                {job.requirements && job.requirements.length > 0 && (
                    <div>
                    <h4 className="font-semibold text-xl mb-2">Requirements</h4>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        {job.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                        ))}
                    </ul>
                    </div>
                )}
                 <div className="text-sm text-muted-foreground">
                    Applications close on {new Date(job.closingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4 p-4 sm:p-6 border-t">
                    <h4 className="font-semibold text-xl">How to Apply</h4>
                    <div className="flex items-center gap-4">
                        {job.applicationEmail && (
                            <a href={`mailto:${job.applicationEmail}`} className="inline-block">
                                <Button>
                                    <Mail className="mr-2 h-4 w-4"/>
                                    Apply via Email
                                </Button>
                            </a>
                        )}
                        {job.applicationWhatsApp && (
                             <a href={`https://wa.me/${job.applicationWhatsApp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-block">
                                <Button variant="secondary">
                                    <MessageCircle className="mr-2 h-4 w-4"/>
                                    Apply on WhatsApp
                                </Button>
                            </a>
                        )}
                        {!job.applicationEmail && !job.applicationWhatsApp && (
                            <Link href={`/jobs/apply/${job.id}`}>
                                <Button>Apply Now</Button>
                            </Link>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}