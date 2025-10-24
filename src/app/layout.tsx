import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Dove Ned - Where Opportunities Take Flight',
  description: 'Dove Ned is a modern platform connecting dreams with direction, where job seekers and employers meet, communicate, and create meaningful futures.',
  icons: {
    icon: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.2.36.44.7.72 1.02.4.45.88.83 1.44 1.13.56.3 1.18.45 1.8.45s1.24-.15 1.8-.45c.56-.3 1.04-.68 1.44-1.13.28-.32.52-.66.72-1.02C19.13 20.17 22 16.42 22 12z' /><path d='M16 8a4 4 0 0 0-8 0c0 1.08.44 2.06.81 2.81' /></svg>`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <div className="relative flex min-h-screen flex-col bg-background">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
