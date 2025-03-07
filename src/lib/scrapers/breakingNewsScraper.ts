import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../prisma';

// Types for breaking news
interface BreakingNews {
  text: string;
  url?: string;
  timestamp: Date;
  locale: 'en' | 'ar';
}

/**
 * Scrape breaking news from Al Mayadeen Arabic website
 */
async function scrapeArabicNews(): Promise<BreakingNews[]> {
  try {
    const response = await axios.get('https://www.almayadeen.net/');
    const $ = cheerio.load(response.data);
    const breakingNews: BreakingNews[] = [];

    // Selector for Arabic breaking news items
    $('#ticker-box ul li .ticker-item .ticker-text').each((i, element) => {
      const text = $(element).find('a p').text().trim();
      const url = $(element).find('a').attr('href');
      
      if (text) {
        breakingNews.push({
          text,
          url: url ? `https://www.almayadeen.net${url}` : undefined,
          timestamp: new Date(),
          locale: 'ar'
        });
      }
    });

    return breakingNews;
  } catch (error) {
    console.error('Error scraping Arabic news:', error);
    return [];
  }
}

/**
 * Scrape breaking news from Al Mayadeen English website
 */
async function scrapeEnglishNews(): Promise<BreakingNews[]> {
  try {
    const response = await axios.get('https://english.almayadeen.net/');
    const $ = cheerio.load(response.data);
    const breakingNews: BreakingNews[] = [];

    // Selector for English breaking news items
    $('.ticker__item').each((i, element) => {
      const text = $(element).text().trim();
      
      if (text) {
        breakingNews.push({
          text,
          timestamp: new Date(),
          locale: 'en'
        });
      }
    });

    return breakingNews;
  } catch (error) {
    console.error('Error scraping English news:', error);
    return [];
  }
}

/**
 * Save breaking news to database
 */
async function saveBreakingNewsToDb(news: BreakingNews[]) {
  try {
    // First, delete old news to avoid accumulating too many entries
    // Keep only news from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await prisma.breakingNews.deleteMany({
      where: {
        timestamp: {
          lt: yesterday
        }
      }
    });

    // Insert new news items
    for (const item of news) {
      await prisma.breakingNews.create({
        data: {
          text: item.text,
          url: item.url || null,
          timestamp: item.timestamp,
          locale: item.locale
        }
      });
    }
    
    console.log(`Successfully saved ${news.length} breaking news items`);
  } catch (error) {
    console.error('Error saving breaking news to database:', error);
  }
}

/**
 * Main function to scrape and save breaking news
 * @param locale Optional locale to specify which language to scrape ('en', 'ar', or both if not specified)
 * @returns Array of scraped news items
 */
export async function scrapeBreakingNews(locale?: 'en' | 'ar') {
  console.log(`Starting breaking news scraper for locale: ${locale || 'all'}`);
  
  try {
    let arabicNews: BreakingNews[] = [];
    let englishNews: BreakingNews[] = [];
    
    // Determine which sources to scrape based on locale
    if (!locale || locale === 'ar') {
      arabicNews = await scrapeArabicNews();
      console.log(`Scraped ${arabicNews.length} Arabic news items`);
    }
    
    if (!locale || locale === 'en') {
      englishNews = await scrapeEnglishNews();
      console.log(`Scraped ${englishNews.length} English news items`);
    }
    
    // Save to database
    const allNews = [...arabicNews, ...englishNews];
    if (allNews.length > 0) {
      await saveBreakingNewsToDb(allNews);
    }
    
    console.log('Breaking news scraping completed successfully');
    return allNews;
  } catch (error) {
    console.error('Error in breaking news scraper:', error);
    return [];
  }
}

// If running directly (not imported)
if (require.main === module) {
  scrapeBreakingNews()
    .catch(console.error)
    .finally(async () => {
      await prisma.$disconnect();
    });
} 