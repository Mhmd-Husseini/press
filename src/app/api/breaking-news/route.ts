import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get the locale from the query parameters
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'en';

    // Validate locale
    if (locale !== 'en' && locale !== 'ar') {
      return NextResponse.json(
        { error: 'Invalid locale parameter. Must be "en" or "ar".' },
        { status: 400 }
      );
    }

    // Get the latest breaking news for the specified locale
    const news = await prisma.breakingNews.findMany({
      where: {
        locale: locale as 'en' | 'ar'
      },
      orderBy: {
        timestamp: 'desc'  // Order by timestamp descending (newest first)
      },
      take: 10  // Take only the 10 latest items
    });

    // Add console log for debugging
    console.log(`Fetched ${news.length} breaking news items for locale: ${locale}`);

    // Return the news items
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error in breaking news API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch breaking news' },
      { status: 500 }
    );
  }
} 