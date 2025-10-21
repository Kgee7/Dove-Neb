'use client';

import { notFound } from "next/navigation";
import Image from "next/image";
import { doc } from "firebase/firestore";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";

import { Job } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ApplyPage({ params }: { params: { id: string } }) {
    const firestore = useFirestore();
    const id = params.id;
    const jobRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'jobListings', id);
    }, [firestore, id]);

    const { data: job, isLoading } = useDoc<Job>(jobRef);

    if (isLoading) {
        return (
          <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }

    if (!job) {
        notFound();
    }

    return (
        <div className="container max-w-3xl py-12">
            <Card>
                <CardHeader className="text-center">
                    <div className={cn("mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg", job.logoBg)}>
                        <Image
                            src={job.logoUrl}
                            alt={`${job.company} logo`}
                            width={48}
                            height={48}
                            className="rounded-md object-contain"
                        />
                    </div>
                    <CardTitle className="text-2xl font-headline">Apply for {job.title}</CardTitle>
                    <CardDescription>at {job.company}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" placeholder="John" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" placeholder="Doe" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="john.doe@example.com" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" placeholder="(123) 456-7890" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="resume">Resume/CV</Label>
                            <Input id="resume" type="file" />
                            <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (Max 5MB)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                            <Textarea id="coverLetter" placeholder="Tell us why you're a great fit for this role..." />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" className="bg-accent hover:bg-accent/90">Submit Application</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
