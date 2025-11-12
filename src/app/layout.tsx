
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers';

const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <rect width="100%" height="100%" fill="#7ea6ab"/>
  <defs>
    <linearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2aa6a0"/>
      <stop offset="100%" stop-color="#1f8f91"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4fc0b8"/>
      <stop offset="100%" stop-color="#2aa6a0"/>
    </linearGradient>
    <clipPath id="circleClip">
      <circle cx="600" cy="420" r="260" />
    </clipPath>
  </defs>
  <g transform="translate(0,0)">
    <circle cx="600" cy="420" r="260" fill="#ffffff"/>
    <circle cx="600" cy="420" r="200" fill="#0f2b3a"/>
    <path d="M600 180 C760 180, 860 300, 820 410 C780 520, 670 600, 600 640 C540 600, 430 520, 380 410 C330 300, 440 180, 600 180 Z" fill="url(#tealGrad)"/>
  </g>
  <path d="M520 200 C490 220, 480 260, 500 300 C520 340, 560 360, 600 360 C620 320, 610 240, 560 210 C540 200, 530 195, 520 200 Z" fill="url(#accentGrad)"/>
  <g transform="translate(0,0)" clip-path="url(#circleClip)">
    <path d="M450 520 C520 600, 740 640, 780 560 C760 570, 640 590, 520 520 C500 505, 480 495, 450 520 Z" fill="#0f7f80"/>
    <path d="M400 460 C420 420, 460 380, 520 370 C560 360, 620 370, 660 410 C690 440, 720 520, 660 560 C620 590, 540 610, 500 600 C470 590, 430 560, 400 520 C380 500, 390 490, 400 460 Z" fill="#ffffff"/>
    <path d="M430 400 C470 360, 540 350, 600 360 C640 370, 680 410, 630 430 C590 445, 530 460, 470 460 C450 450, 435 425, 430 400 Z" fill="#ffffff"/>
    <path d="M520 470 C560 450, 610 430, 640 410 C620 440, 580 460, 520 470 Z" fill="#2aa6a0"/>
    <circle cx="620" cy="430" r="8" fill="#0f2b3a"/>
  </g>
  <g fill="#ffffff" opacity="0.95">
    <circle cx="560" cy="240" r="3"/>
    <circle cx="580" cy="250" r="2.5"/>
    <circle cx="590" cy="230" r="2.2"/>
    <circle cx="600" cy="250" r="2.0"/>
  </g>
  <path d="M840 420 C840 610, 630 820, 420 820 C210 820, 0 610, 0 420 C0 230, 210 20, 420 20 C630 20, 840 230, 840 420 Z" fill="none" stroke="#ffffff" stroke-width="0" opacity="0"/>
  <path d="M760 420 A260 260 0 1 1 600 160 A170 170 0 1 0 760 420 Z" fill="#ffffff" opacity="1"/>
  <g transform="translate(0,0)">
    <circle cx="600" cy="420" r="260" fill="none" stroke="#ffffff" stroke-width="0"/>
  </g>
</svg>
`.replace(/\n/g, '').replace(/"/g, "'");


export const metadata: Metadata = {
  title: 'Dove Neb - Where Opportunities Take Flight',
  description: 'Dove Neb is a modern platform connecting dreams with direction, where job seekers and employers meet, communicate, and create meaningful futures.',
  icons: {
    icon: `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`,
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
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
