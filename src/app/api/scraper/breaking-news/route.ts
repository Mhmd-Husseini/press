import { NextResponse } from 'next/server';
import { scrapeBreakingNews } from '@/lib/scrapers/breakingNewsScraper';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Extract the locale from the URL parameters
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'en';
    
    // Validate the locale
    if (locale !== 'en' && locale !== 'ar') {
      return NextResponse.json({ 
        error: 'Invalid locale. Must be "en" or "ar".' 
      }, { status: 400 });
    }

    console.log(`Scraper API triggered for locale: ${locale}`);
    
    // Run the scraper for the specified locale
    const result = await scrapeBreakingNews(locale as 'en' | 'ar');
    
    return NextResponse.json({ 
      success: true, 
      message: `Breaking news scraped successfully for ${locale}`,
      count: result.length
    });
  } catch (error) {
    console.error('Error in breaking news scraper API route:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to scrape breaking news'
    }, { status: 500 });
  } finally {
    // Always disconnect from Prisma to avoid hanging connections
    await prisma.$disconnect();
  }
} 