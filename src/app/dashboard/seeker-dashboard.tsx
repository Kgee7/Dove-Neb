'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wand2, Search } from "lucide-react";

type SeekerDashboardProps = {
    userProfile: {
        firstName: string;
        lastName: string;
    } | null;
}

export default function SeekerDashboard({ userProfile }: SeekerDashboardProps) {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Welcome, {userProfile?.firstName || 'Job Seeker'}!</h1>
        <p className="text-muted-foreground">Let's find your next opportunity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>AI-Powered Job Matching</CardTitle>
                <CardDescription>Let our AI find the best roles for you based on your skills and experience.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center p-8">
                <Wand2 className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold">Get Personalized Suggestions</h3>
                <p className="text-muted-foreground mb-4">Answer a few questions and let our AI do the searching.</p>
                <Link href="/ai-matching">
                    <Button className="bg-accent hover:bg-accent/90">
                        <Wand2 className="mr-2 h-4 w-4"/>
                        Start AI Matching
                    </Button>
                </Link>
            </CardContent>
        </Card>
        
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Applications</CardTitle>
                    <CardDescription>Track the status of your job applications.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center p-8">
                    <FileText className="w-10 h-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
                    <Link href="/jobs" className="mt-4">
                        <Button variant="outline">
                            <Search className="mr-2 h-4 w-4"/>
                            Browse Jobs
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
