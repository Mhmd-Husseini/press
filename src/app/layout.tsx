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
    template: '%s | Ektisadi.com',
    default: 'Ektisadi.com - الاقتصادي.كوم | الإقتصاد والناس والعالم',
  },
  description: "الاقتصادي.كوم يقدم الأخبار في الوقت المناسب والتحليلات من جميع أنحاء العالم.",
  keywords: ["news", "ektisadi.com", "economy", "journalism", "media", "articles", "press", "stories"],
  authors: [{ name: "Ektisadi Media Group" }],
  creator: "Ektisadi Media Group",
  publisher: "Ektisadi Media Group",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ektisadi.com/',
    siteName: 'Ektisadi.com',
    title: 'Ektisadi.com - الاقتصادي.كوم | الإقتصاد والناس والعالم',
    description: 'الاقتصادي.كوم يقدم الأخبار في الوقت المناسب والتحليلات من جميع أنحاء العالم.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ektisadi.com - الاقتصادي.كوم | الإقتصاد والناس والعالم'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ektisadi.com - الاقتصادي.كوم | الإقتصاد والناس والعالم',
    description: 'الاقتصادي.كوم يقدم الأخبار في الوقت المناسب والتحليلات من جميع أنحاء العالم.',
    creator: '@Ektisadi.com',
    images: ['/twitter-image.png']
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairoFont.variable} antialiased bg-gray-50 font-arabic`}
      >
        {children}
      </body>
    </html>
  );
}
