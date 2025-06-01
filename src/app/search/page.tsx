'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleCard from '@/components/shared/ArticleCard';
import MainLayout from '@/components/layouts/MainLayout';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  createdAt: string;
  publishedAt: string;
  authorName?: string;
  imageUrl?: string;
  status: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const locale = searchParams.get('locale') || 'en';
  const isRTL = locale === 'ar';
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }
        
        const data = await response.json();
        setResults(data.results);
        setTotalResults(data.total);
        setError(null);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('An error occurred while searching. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSearchResults();
  }, [query, locale]);
  
  // Format date based on locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {!query.trim() && !loading ? (
        <>
          <h1 className={`text-3xl font-bold mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL ? 'البحث' : 'Search'}
          </h1>
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              {isRTL 
                ? 'يرجى إدخال مصطلح البحث في شريط البحث أعلاه للعثور على الأخبار.'
                : 'Please enter a search term in the search bar above to find news.'}
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className={`text-3xl font-bold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL ? 'نتائج البحث' : 'Search Results'}
          </h1>
          
          <p className={`text-gray-600 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL 
              ? `${totalResults} نتيجة لـ "${query}"`
              : `${totalResults} results for "${query}"`}
          </p>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md p-4 animate-pulse">
                  <div className="w-full h-48 bg-gray-300 rounded mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                {isRTL 
                  ? `لم يتم العثور على نتائج لـ "${query}". يرجى تجربة مصطلح بحث مختلف.`
                  : `No results found for "${query}". Please try a different search term.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {results.map((result) => (
                <ArticleCard
                  key={result.id}
                  id={result.id}
                  title={result.title}
                  summary={result.excerpt}
                  slug={result.slug}
                  imageUrl={result.imageUrl || '/images/default-post-image.svg'}
                  authorName={result.authorName || 'Phoenix Staff'}
                  publishedAt={result.publishedAt || result.createdAt}
                  size="medium"
                  variant="vertical"
                  locale="en"
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <MainLayout>
      <Suspense fallback={<SearchFallback />}>
        <SearchContent />
      </Suspense>
    </MainLayout>
  );
} 