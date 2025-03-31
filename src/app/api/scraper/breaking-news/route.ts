import { NextResponse } from 'next/server';
import { scrapeBreakingNews } from '@/lib/scrapers/breakingNewsScraper';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Extract the locale from the URL parameters
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'en';
    
    // Validate the locale
    if (locale !== 'en' && locale !== 'ar') {
      console.error(`Invalid locale requested: ${locale}`);
      return NextResponse.json({ 
        error: 'Invalid locale. Must be "en" or "ar".' 
      }, { status: 400 });
    }

    console.log(`Breaking News Scraper triggered via API for locale: ${locale}`);
    
    // Run the scraper for the specified locale
    const result = await scrapeBreakingNews(locale as 'en' | 'ar');
    const duration = Date.now() - startTime;
    
    console.log(`Breaking News Scraper completed in ${duration}ms - Found ${result.length} items for ${locale}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Breaking news scraped successfully for ${locale}`,
      count: result.length,
      executionTimeMs: duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error in breaking news scraper API route (${duration}ms):`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to scrape breaking news',
      executionTimeMs: duration
    }, { status: 500 });
  } finally {
    // Always disconnect from Prisma to avoid hanging connections
    await prisma.$disconnect();
  }
} 