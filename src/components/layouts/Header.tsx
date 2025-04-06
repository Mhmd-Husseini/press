'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { setLanguage } from '@/app/actions';
import { useCategories } from '@/hooks/useCategories';
import { BreakingNewsService } from '@/lib/services/breakingNews.service';

// Define the BreakingNews type
interface BreakingNews {
  id: string;
  text: string;
  url?: string | null;
  timestamp: Date;
  locale: string;
}

// Custom hook to fetch breaking news
function useBreakingNews(locale: string) {
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

    // Set up a timer to rotate through breaking news items every 5 seconds (reduced from 10 for better testing)
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
}

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');
  const [currentDate, setCurrentDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch categories from the API using our custom hook
  const { categories, loading, error } = useCategories(currentLocale);

  // Breaking news hook
  const { currentNews, allNews, loading: newsLoading, currentNewsIndex } = useBreakingNews(currentLocale);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Open search in a new tab
      window.open(`/search?q=${encodeURIComponent(searchQuery)}&locale=${currentLocale}`, '_blank');
      setMobileSearchOpen(false);
    }
  };

  useEffect(() => {
    // Get current locale from cookie
    const locale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'en';
    
    setCurrentLocale(locale);

    // Format the current date based on locale
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const date = new Date();
    setCurrentDate(date.toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-US', dateOptions));

    // Apply RTL to the entire document when Arabic is selected
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', locale === 'ar');
  }, []);

  const switchLanguage = (locale: 'en' | 'ar') => {
    // Set the cookie
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    setCurrentLocale(locale);
    
    // Apply RTL direction
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', locale === 'ar');
    
    // Reload the current page to apply the language change
    window.location.reload();
  };

  // Fallback categories in case API fails or while loading
  const fallbackCategories = [
    { name: { en: 'World', ar: 'العالم' }, slug: 'world' },
    { name: { en: 'Politics', ar: 'السياسة' }, slug: 'politics' },
    { name: { en: 'Business', ar: 'الأعمال' }, slug: 'business' },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (!mobileMenuOpen) setMobileSearchOpen(false);
  };

  const toggleMobileSearch = () => {
    setMobileSearchOpen(!mobileSearchOpen);
    if (!mobileSearchOpen) setMobileMenuOpen(false);
  };

  const isRTL = currentLocale === 'ar';
  
  // Use database categories or fallback if loading/error
  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  return (
    <header className="bg-white text-gray-800" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="bg-gray-800 py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className={`text-sm text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
              {currentDate}
            </div>
            <div className={`flex ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'} text-sm`}>
              <Link href="/contact" className="text-gray-400 hover:text-gray-900 transition-colors">
                {isRTL ? 'اتصل بنا' : 'Contact Us'}
              </Link>
              <button
                onClick={() => switchLanguage(isRTL ? 'en' : 'ar')}
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                {isRTL ? 'English' : 'العربية'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className='bg-red-800 h-[0.4px] opacity-70'></div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-3 bg-gray-800 border-b border-gray-200">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className={` ${isRTL ? 'ml-2' : 'mr-2'}`}>
                <Image
                  src="/phoenix-logo.svg"
                  alt="Phoenix Press"
                  width={70}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-l font-semibold  text-gray-400">Phoenix</span>
                <span className={`text-l font-senibold text-gray-400 ${isRTL ? 'mr-1' : 'ml-1'}`}>Press</span>
              </div>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder={isRTL ? 'ابحث عن الأخبار' : 'Search for news'}
                className={`bg-gray-800 text-gray-300 border border-gray-600 px-4 py-2 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5 text-gray-300 hover:text-white`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {/* Search Icon */}
            <button onClick={toggleMobileSearch} className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Menu Icon */}
            <button onClick={toggleMobileMenu} className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="hidden md:flex items-center justify-between h-12">
            <ul className={`flex ${isRTL ? 'space-x-reverse space-x-6' : 'space-x-6'}`}>
              {loading ? (
                // Show skeleton loaders while categories are loading
                <>
                  {[1, 2, 3].map((i) => (
                    <li key={i} className="animate-pulse">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </li>
                  ))}
                </>
              ) : (
                // Show actual categories once loaded
                displayCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="text-gray-700 hover:text-amber-600 transition-colors"
                    >
                      {isRTL ? category.name.ar : category.name.en}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Breaking News Bar */}
      <div className="bg-red-600 py-2 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <span className={`text-white font-bold uppercase text-xs ${isRTL ? 'ml-3' : 'mr-3'} px-2 py-1 bg-red-700 rounded flex items-center justify-center`}>
              <span className="hidden md:inline">{isRTL ? 'عاجل' : 'Breaking'}</span>
              <span className="md:hidden">!</span>
            </span>
            
            {newsLoading ? (
              // Loading state
              <div className="animate-pulse h-4 w-3/4 bg-red-500 rounded"></div>
            ) : allNews.length > 0 ? (
              // Simple news ticker without links
              <div className="overflow-hidden relative w-full">
                <div className="news-ticker-wrap">
                  {allNews.map((item, index) => (
                    <div 
                      key={item.id}
                      className={`news-ticker-item ${index === currentNewsIndex ? 'active' : ''}`}
                      style={{ opacity: index === currentNewsIndex ? 1 : 0 }}
                    >
                      <span className={`text-white text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Fallback when no news is available
              <span className={`text-white text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL 
                  ? 'الرئيس يعلن عن خطة جديدة للإصلاح الاقتصادي تشمل استثمارات بقيمة 50 مليار دولار' 
                  : 'President announces new economic reform plan with $50 billion investment package'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search - Dropdown */}
      {mobileSearchOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-3 shadow-md">
          <div className="container mx-auto px-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder={isRTL ? 'ابحث عن الأخبار' : 'Search for news'}
                className={`bg-gray-200 text-gray-300 border border-gray-300 px-4 py-2 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button 
                type="submit"
                className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5 text-gray-300 hover:text-gray-900`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                placeholder={isRTL ? 'ابحث عن الأخبار' : 'Search for news'}
                className={`bg-gray-200 text-gray-300 border border-gray-300 px-4 py-2 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5 text-gray-600 hover:text-gray-900`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            {/* Categories */}
            <ul className={`space-y-3 pb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {loading ? (
                // Show skeleton loaders while categories are loading
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={i} className="animate-pulse">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </li>
                  ))}
                </>
              ) : (
                // Show actual categories once loaded
                displayCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="text-gray-700 hover:text-amber-600 transition-colors"
                      onClick={toggleMobileMenu}
                    >
                      {isRTL ? category.name.ar : category.name.en}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;