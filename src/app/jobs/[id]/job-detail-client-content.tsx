
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, Share2, Mail, MessageCircle } from 'lucide-react';
import type { Job } from '@/lib/data';

export default function JobDetailClientContent({ job }: { job: Job }) {
  const hasDirectApply = job.applicationEmail || job.applicationWhatsApp;

  return (
    <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-col items-stretch gap-2">
        {hasDirectApply ? (
          <>
            {job.applicationEmail && (
              <Button asChild className="w-full bg-accent hover:bg-accent/90">
                <a href={`mailto:${job.applicationEmail}?subject=Application for ${job.title}`}>
                  <Mail className="mr-2" /> Apply via Email
                </a>
              </Button>
            )}
            {job.applicationWhatsApp && (
              <Button asChild variant="outline" className="w-full">
                <a href={`https://wa.me/${job.applicationWhatsApp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2" /> Apply on WhatsApp
                </a>
              </Button>
            )}
          </>
        ) : (
          <Link href={`/jobs/apply/${job.id}`} className="w-full">
            <Button className="w-full bg-accent hover:bg-accent/90">Apply Now</Button>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon"><Heart className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
