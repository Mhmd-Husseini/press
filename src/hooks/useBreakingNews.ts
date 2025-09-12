import { useState, useEffect } from 'react';

// Define the BreakingNews type
type BreakingNews = {
  id: string;
  text: string;
  timestamp: Date;
  locale: string;
}

export const useBreakingNews = (locale: string) => {
  const [news, setNews] = useState<BreakingNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/breaking-news?locale=${locale}`);
        if (!response.ok) {
          throw new Error('Failed to fetch breaking news');
        }
        const data = await response.json();
        console.log(`Breaking news data received for ${locale}:`, data);
        setNews(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching breaking news:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    };

    fetchBreakingNews();

    // Set up a timer to rotate through breaking news items every 7 seconds (desktop only)
    const interval = setInterval(() => {
      if (news.length > 0) {
        setIsTransitioning(true);
        
        // Start transition, then change content after a brief delay
        setTimeout(() => {
          setCurrentNewsIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % news.length;
            return nextIndex;
          });
          
          // End transition after content changes
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 300);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [locale, news.length]);

  // Return both individual news for desktop and all news for mobile
  return {
    currentNews: news.length > 0 ? news[currentNewsIndex] : null,
    allNews: news,
    loading,
    error,
    currentNewsIndex,
    isTransitioning
  };
};
