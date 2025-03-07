import prisma from '../prisma';

/**
 * Service for managing breaking news
 */
export class BreakingNewsService {
  /**
   * Get the latest breaking news by locale
   * @param locale The locale to get news for ('en' or 'ar')
   * @param limit Maximum number of news items to return
   */
  static async getLatestNews(locale: 'en' | 'ar', limit: number = 10) {
    try {
      const news = await prisma.breakingNews.findMany({
        where: {
          locale
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit
      });
      
      return news;
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      return [];
    }
  }

  /**
   * Get a single random breaking news item by locale
   * @param locale The locale to get news for ('en' or 'ar')
   */
  static async getRandomNews(locale: 'en' | 'ar') {
    try {
      // Count total news for this locale
      const count = await prisma.breakingNews.count({
        where: {
          locale
        }
      });
      
      if (count === 0) {
        return null;
      }
      
      // Get a random index
      const randomIndex = Math.floor(Math.random() * count);
      
      // Get the news at that index
      const news = await prisma.breakingNews.findMany({
        where: {
          locale
        },
        skip: randomIndex,
        take: 1
      });
      
      return news.length > 0 ? news[0] : null;
    } catch (error) {
      console.error('Error fetching random breaking news:', error);
      return null;
    }
  }
} 