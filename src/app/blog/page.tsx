
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Briefcase, 
  Home, 
  Bot, 
  ArrowRight,
  UserPlus
} from 'lucide-react';
import data from '@/lib/placeholder-images.json';

export default function BlogPage() {
  const images = data.placeholderImages;
  const heroImage = images.find(img => img.id === 'hero-background');
  const startedImage = images.find(img => img.id === 'blog-getting-started');
  const aiImage = images.find(img => img.id === 'blog-ai-tools');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-4 py-1 px-4 font-bold uppercase tracking-wider text-[10px]">Platform Guide</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-headline mb-6">
            Mastering Dove Neb
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your comprehensive guide to navigating the world's most intuitive platform for finding careers and luxury stays.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl space-y-24">
          
          {/* Step 1: Getting Started */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-xl mb-2">1</div>
              <h2 className="text-3xl font-bold font-headline">Create Your Identity</h2>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're looking for your next big break or a place to call home, everything starts with a verified profile. 
                Our secure sign-up process allows you to choose between being a <strong>Seeker</strong> or an <strong>Employer/Owner</strong>.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Personalized Dashboards
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Secure Data Encryption
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Real-time Notifications
                </li>
              </ul>
              <Link href="/signup">
                <Button className="mt-4 font-bold h-11 px-8">
                  Get Started <UserPlus className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
              {startedImage && (
                <Image 
                  src={startedImage.imageUrl} 
                  alt={startedImage.description} 
                  data-ai-hint={startedImage.imageHint}
                  fill 
                  className="object-cover" 
                />
              )}
            </div>
          </div>

          {/* Section: The Tools */}
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">Powerful Tools at Your Fingertips</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We've built specialized tools to ensure your journey is smooth, efficient, and successful.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tool 1: Neb AI */}
              <Card className="border-primary/10 shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Neb AI Assistant</CardTitle>
                  <CardDescription>Your 24/7 support partner.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Neb isn't just a chatbot. It can search the database for you, optimize your room images for listing, and even generate new professional photos from your descriptions.
                </CardContent>
              </Card>

              {/* Tool 2: Smart Search */}
              <Card className="border-primary/10 shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle>Unified Split Search</CardTitle>
                  <CardDescription>Find exactly what you need.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Our advanced search engine allows you to filter by location, role, and property type simultaneously. It updates in real-time as you type for instant discovery.
                </CardContent>
              </Card>

              {/* Tool 3: Lifecycle Management */}
              <Card className="border-primary/10 shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Automatic Cleanup</CardTitle>
                  <CardDescription>Always fresh listings.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  No more ghost listings. Our system automatically checks for expired jobs and room sales, asking you if you've been successful before archiving them.
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section: AI Features */}
          <div className="bg-muted/50 rounded-[3rem] p-8 md:p-16 grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl order-last md:order-first">
              {aiImage && (
                <Image 
                  src={aiImage.imageUrl} 
                  alt={aiImage.description} 
                  data-ai-hint={aiImage.imageHint}
                  fill 
                  className="object-cover" 
                />
              )}
            </div>
            <div className="space-y-6">
              <Badge className="bg-primary hover:bg-primary font-bold">New Feature</Badge>
              <h2 className="text-3xl font-bold font-headline">AI Image Enhancement</h2>
              <p className="text-muted-foreground">
                First impressions are everything. If your room photos are too large or need a professional touch, simply upload them to the <strong>Support Page</strong>. 
                Our AI will optimize the resolution and clarity, ensuring they look stunning on any screen while fitting perfectly in our database.
              </p>
              <div className="pt-4 flex flex-col gap-4">
                <div className="flex gap-4">
                  <Sparkles className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold">Image Optimization</h4>
                    <p className="text-xs text-muted-foreground">Compress and sharpen photos automatically.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <MapPin className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold">Agentic Search</h4>
                    <p className="text-xs text-muted-foreground">Ask Neb to find specific links for you in the chat.</p>
                  </div>
                </div>
              </div>
              <Link href="/support">
                <Button variant="outline" className="mt-4 border-primary text-primary hover:bg-primary/5 font-bold">
                  Try AI Tools <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* FAQ / Final CTA */}
          <div className="text-center py-12 border-t">
            <h2 className="text-3xl font-bold mb-6">Ready to take flight?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/jobs">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 font-bold">
                  <Briefcase className="mr-2 h-5 w-5" /> Find a Job
                </Button>
              </Link>
              <Link href="/rooms">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto h-12 px-8 font-bold">
                  <Home className="mr-2 h-5 w-5" /> Explore Lodge Now
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: "default" | "secondary", className?: string }) {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground"
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
