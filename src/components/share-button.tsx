
'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Share2, Link as LinkIcon, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Inline SVG for WhatsApp icon
const WhatsAppIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2 h-4 w-4"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);


type ShareButtonProps = {
  title: string;
  text: string;
  className?: string;
};

export default function ShareButton({ title, text, className }: ShareButtonProps) {
  const { toast } = useToast();

  const handleShare = (platform: 'whatsapp' | 'email' | 'copy') => {
    if (typeof window === 'undefined') return;

    const url = window.location.href;
    
    // Structured format: Message Body -> Check it out: URL
    const fullMessageText = `${text}\n\nCheck it out: ${url}`;
    const encodedText = encodeURIComponent(fullMessageText);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(
          () => {
            toast({
              title: 'Link Copied!',
              description: 'The link has been copied to your clipboard.',
            });
          },
          (err) => {
            toast({
              variant: 'destructive',
              title: 'Failed to Copy',
              description: 'Could not copy the link to your clipboard.',
            });
            console.error('Could not copy text: ', err);
          }
        );
        break;
      default:
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className={className}>
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <WhatsAppIcon />
          <span>Share on WhatsApp</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('email')}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Share via Email</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')}>
          <LinkIcon className="mr-2 h-4 w-4" />
          <span>Copy Link</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
