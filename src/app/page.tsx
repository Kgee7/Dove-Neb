
'use client';

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Search,
  Users,
  MapPin,
  Heart,
  Sparkles,
  Loader2,
  Globe,
} from "lucide-react";
import { useCollection, useFirestore, collection } from '@/firebase';
import { useMemo } from 'react';

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Job } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

export default function Home() {
  const heroImage = PlaceHolderImages.find(
    (img) => img.id === "hero-background"
  );
  const aiImage = PlaceHolderImages.find((img) => img.id === "ai-matching-bg");

  const firestore = useFirestore();

  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'jobListings');
  }, [firestore]);
  
  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
          <div className="container max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl font-headline">
              Dove Jobs
            </h1>
            <p className="mt-4 text-lg text-foreground/80 md:text-xl">
              Where Opportunities Take Flight.
            </p>
            <Card className="mx-auto mt-8 max-w-2xl shadow-lg">
              <CardContent className="p-4">
                <form className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Job title, keywords, or company"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="City, state, or zip code" className="pl-10" />
                  </div>
                  <Button type="submit" className="bg-accent hover:bg-accent/90">
                    Find Jobs
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-16 sm:py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle>For Job Seekers</CardTitle>
                <CardDescription>Find your next chapter.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create your free account, sign in, and explore hundreds of
                available positions that match your skills, passion, and goals.
                Let our AI help you find the perfect fit.
              </p>
            </CardContent>
          </Card>
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-full bg-accent/10 p-3">
                <Briefcase className="h-8 w-8 text-accent" />
              </div>
              <div>
                <CardTitle>For Employers</CardTitle>
                <CardDescription>Discover top talent.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sign up to post jobs, manage listings, and find the right
                candidates who can bring your vision to life. Our platform makes
                hiring simple and effective.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="bg-secondary/50 py-16 sm:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl font-headline">
              Featured Job Openings
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Explore opportunities from leading companies.
            </p>
          </div>
          {isLoading ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobs?.slice(0, 6).map((job) => (
                <Card
                  key={job.id}
                  className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-2xl"
                >
                  <CardHeader className="flex flex-row items-start gap-4 p-4">
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", job.logoBg)}>
                      <Image
                        src={job.logoUrl}
                        alt={`${job.company} logo`}
                        width={40}
                        height={40}
                        className="rounded-md object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      <CardTitle className="text-lg">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.title}
                        </Link>
                      </CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 pt-0">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline">{job.type}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {job.workArrangement === 'Remote' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        {job.location}
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {job.currencySymbol}{job.salary}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-12 text-center">
            <Link
              href="/jobs"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Explore All Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* AI Matching Section */}
      <section className="relative py-16 sm:py-24">
          <div className="absolute inset-0 overflow-hidden">
            {aiImage && <Image src={aiImage.imageUrl} alt={aiImage.description} data-ai-hint={aiImage.imageHint} fill className="object-cover" />}
            <div className="absolute inset-0 bg-primary/80 dark:bg-primary/90 mix-blend-multiply" />
          </div>
          <div className="container relative z-10 text-center">
              <div className="mx-auto max-w-2xl">
                <div className="inline-flex items-center rounded-full bg-primary-foreground/20 px-4 py-1 text-sm font-medium text-primary-foreground backdrop-blur-sm">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Powered by AI
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl font-headline">
                    Let AI Find Your Dream Job
                </h2>
                <p className="mt-4 text-lg text-primary-foreground/90">
                    Our intelligent matching system analyzes your profile to recommend jobs where you'll thrive. Stop searching, start matching.
                </p>
                <Link href="/ai-matching" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "mt-8 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary")}>
                    Try AI Matching <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
          </div>
      </section>
    </div>
  );
}
