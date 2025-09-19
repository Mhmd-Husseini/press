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
    template: '%s | Bidderij',
    default: 'Bidderij - بدّارج | Where Stories Rise',
  },
  description: "Bidderij delivers timely news and thoughtful analysis on the most important stories from around the world, with a focus on accuracy and integrity.",
  keywords: ["news", "bidderij", "journalism", "media", "articles", "press", "stories"],
  authors: [{ name: "Bidderij Media Group" }],
  creator: "Bidderij Media Group",
  publisher: "Bidderij Media Group",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bidderij.com/',
    siteName: 'Bidderij',
    title: 'Bidderij - Where Stories Rise',
    description: 'Bidderij delivers timely news and thoughtful analysis on the most important stories from around the world.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Bidderij - بدّارج'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bidderij - Where Stories Rise',
    description: 'Bidderij delivers timely news and thoughtful analysis on the most important stories from around the world.',
    creator: '@Bidderij',
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
        <link rel="icon" href="/bidderij-favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairoFont.variable} antialiased bg-gray-50`}
      >
        {children}
      </body>
    </html>
  );
}
