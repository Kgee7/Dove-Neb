import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Dove Jobs - Where Opportunities Take Flight',
  description: 'Dove Jobs is a modern job platform connecting dreams with direction, where job seekers and employers meet, communicate, and create meaningful futures.',
  icons: {
    icon: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10.18 13.92A4.5 4.5 0 0 0 9.03 8.8a4.5 4.5 0 0 0-4.06-4.06C2.37 4.28.2 6.45.69 9.01a4.5 4.5 0 0 0 4.06 4.06c.48.09.96.14 1.43.14.77 0 1.53-.14 2.25-.42' /><path d='M22.04 7.9c.49-2.56-1.67-4.73-4.23-4.24a4.5 4.5 0 0 0-4.06 4.06c.09.48.14.96.14 1.43 0 .77-.14 1.53-.42 2.25-.63 1.63-2.16 2.8-3.9 3.16' /><path d='M8.27 21.99a4.5 4.5 0 0 1-4.06-4.06c-.48-2.56 1.69-4.73 4.25-4.24a4.5 4.5 0 0 1 4.06 4.06c-.09.48-.14.96-.14 1.43 0 .77.14 1.53.42 2.25.63 1.63 2.16 2.8 3.9 3.16' /><path d='M18.82 8.08a4.5 4.5 0 0 1 4.06 4.06c.48 2.56-1.69 4.73-4.25 4.24a4.5 4.5 0 0 1-4.06-4.06c.09-.48.14-.96.14-1.43 0-.77-.14-1.53-.42-2.25-.63-1.63-2.16-2.8-3.9-3.16' /></svg>`,
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
