import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Cairo } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Arabic font
const cairoFont = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: '%s | Ektisadi Press',
    default: 'Ektisadi Press - الاقتصادي | Where Stories Rise',
  },
  description: "Ektisadi Press delivers timely news and thoughtful analysis on the most important stories from around the world, with a focus on accuracy and integrity.",
  keywords: ["news", "ektisadi press", "journalism", "media", "articles", "press", "stories"],
  authors: [{ name: "Ektisadi Media Group" }],
  creator: "Ektisadi Media Group",
  publisher: "Ektisadi Media Group",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ektisadi-press.com/',
    siteName: 'Ektisadi Press',
    title: 'Ektisadi Press - Where Stories Rise',
    description: 'Ektisadi Press delivers timely news and thoughtful analysis on the most important stories from around the world.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ektisadi Press - الاقتصادي'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ektisadi Press - Where Stories Rise',
    description: 'Ektisadi Press delivers timely news and thoughtful analysis on the most important stories from around the world.',
    creator: '@EktisadiPress',
    images: ['/twitter-image.png']
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairoFont.variable} antialiased bg-gray-50`}
      >
        {children}
      </body>
    </html>
  );
}
