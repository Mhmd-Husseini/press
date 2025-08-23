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

  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        setLoading(true);
        // Update the endpoint to match where breaking news is being stored
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

    // Set up a timer to rotate through breaking news items every 5 seconds
    const interval = setInterval(() => {
      if (news.length > 0) {
        setCurrentNewsIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % news.length;
          console.log(`Changing news index from ${prevIndex} to ${nextIndex}`); // Debug log
          return nextIndex;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [locale, news.length]); // Add news.length as dependency

  // Return the current news item, loading state, and error
  return {
    currentNews: news.length > 0 ? news[currentNewsIndex] : null,
    allNews: news,
    loading,
    error,
    currentNewsIndex
  };
};
