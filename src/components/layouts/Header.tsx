'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { setLanguage } from '@/app/actions';
import { useCategories } from '@/hooks/useCategories';
import { useBreakingNews } from '@/hooks/useBreakingNews';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');
  const [currentDate, setCurrentDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Fetch categories from the API using our custom hook
  const { categories, loading, error } = useCategories(currentLocale);

  // Breaking news hook
  const { currentNews, allNews, loading: newsLoading, isTransitioning } = useBreakingNews(currentLocale);

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
    { name: { en: 'World', ar: 'العالم' }, slug: 'world', children: [] },
    { name: { en: 'Politics', ar: 'السياسة' }, slug: 'politics', children: [] },
    { name: { en: 'Business', ar: 'الأعمال' }, slug: 'business', children: [] },
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
    <header className="bg-white text-text-dark" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="w-full py-2 bg-primary-bg border-b border-gray-700">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center">
            <div className={`text-sm text-text-light ${isRTL ? 'text-right' : 'text-left'}`}>
              {currentDate}
            </div>
            <div className={`flex ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'} text-sm`}>
              <Link href="/contact" className="text-text-light hover:text-gray-300 transition-colors">
                {isRTL ? 'اتصل بنا' : 'Contact Us'}
              </Link>
              <button
                onClick={() => switchLanguage(isRTL ? 'en' : 'ar')}
                className="text-text-light hover:text-gray-300 transition-colors"
              >
                {isRTL ? 'English' : 'العربية'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="w-full px-4 py-3 bg-white border-b border-border">
        <div className="container mx-auto md:px-6">
          <div className="flex justify-between items-center">
            {/* Logo */}
                <Link href="/" className="flex items-center">
                  {isRTL ? (
                    <>
                      <span className="text-xl font-bold text-primary-bg">إقتصادي</span>
                      <span className="text-xl font-bold text-accent">.كوم</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-primary-bg">Ektisadi</span>
                      <span className="text-xl font-bold text-accent">.com</span>
                    </>
                  )}
                </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={isRTL ? 'ابحث عن الأخبار' : 'Search for news'}
                  className={`bg-secondary-bg text-text-dark border border-border px-3 py-1.5 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1.5 text-gray-500 hover:text-accent`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Mobile Menu Button */}
            <div className={`md:hidden flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
              {/* Search Icon */}
              <button onClick={toggleMobileSearch} className="text-primary-bg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              {/* Menu Icon */}
              <button onClick={toggleMobileMenu} className="text-primary-bg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="w-full bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className={`hidden md:flex items-center justify-between h-10`}>
            <ul className={`flex ${isRTL ? 'space-x-reverse space-x-8' : 'space-x-8'}`}>
              {loading ? (
                // Show skeleton loaders while categories are loading
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={i} className="animate-pulse py-3">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </li>
                  ))}
                </>
              ) : (
                // Show actual categories once loaded
                displayCategories.map((category) => (
                  <li 
                    key={category.slug} 
                    className="relative group"
                    onMouseEnter={() => setHoveredCategory(category.slug)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <Link
                      href={`/categories/${category.slug}`}
                      className="text-text-dark font-medium hover:text-accent py-2 inline-block border-b-2 border-transparent group-hover:border-accent transition-colors"
                    >
                      {isRTL ? category.name.ar : category.name.en}
                      {/* Show dropdown arrow if category has children */}
                      {category.children && category.children.length > 0 && (
                        <svg 
                          className={`inline-block ml-1 h-4 w-4 transition-transform ${hoveredCategory === category.slug ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </Link>
                    
                    {/* Dropdown for categories with children */}
                    {category.children && category.children.length > 0 && hoveredCategory === category.slug && (
                      <div className="absolute top-full left-0 z-50 min-w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2">
                        {category.children.map((child) => (
                          <Link
                            key={child.slug}
                            href={`/categories/${child.slug}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-accent transition-colors"
                          >
                            {isRTL ? child.name.ar : child.name.en}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Breaking News Bar */}
      <div className="w-full bg-accent py-2 md:py-0 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center">
            <span className={`text-text-light font-bold uppercase text-xs ${isRTL ? 'ml-3' : 'mr-3'} px-2 py-1 bg-primary-bg rounded flex items-center justify-center hidden md:flex`}>
              <span>{isRTL ? 'عاجل' : 'Breaking'}</span>
            </span>
            
            {newsLoading ? (
              // Loading state
              <div className="animate-pulse h-4 w-3/4 bg-red-700 rounded"></div>
            ) : allNews.length > 0 ? (
              <>
                {/* Desktop: Individual rotating news */}
                <div className="hidden md:block py-1">
                  <span className={`text-text-light text-base font-medium transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-30 scale-95' : 'opacity-100 scale-100'} ${isRTL ? 'text-right' : 'text-left'}`}>
                    {currentNews?.text}
                  </span>
                </div>
                
                {/* Mobile: Continuous scrolling news ticker */}
                <div className="md:hidden overflow-hidden relative w-full">
                  <div className={`news-ticker-content ${isRTL ? 'rtl' : 'ltr'}`}>
                    {allNews.slice(0, 8).map((item: any, index: number) => (
                      <span key={item.id} className="news-ticker-item">
                        {item.text}
                        {index < Math.min(allNews.length - 1, 7)}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Desktop: Fallback individual news */}
                <div className="hidden md:block py-1">
                  <span className={`text-text-light text-base font-medium transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-30 scale-95' : 'opacity-100 scale-100'} ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL 
                      ? 'الرئيس يعلن عن خطة جديدة للإصلاح الاقتصادي'
                      : 'President announces new economic reform plan'}
                  </span>
                </div>
                
                {/* Mobile: Fallback continuous scrolling */}
                <div className="md:hidden overflow-hidden relative w-full">
                  <div className={`news-ticker-content ${isRTL ? 'rtl' : 'ltr'}`}>
                    <span className="news-ticker-item">
                      {isRTL 
                        ? 'الرئيس يعلن عن خطة جديدة • الحكومة تطلق برنامج جديد • البنك المركزي يعلن قرارات مهمة • الشركات الكبرى تستثمر في التقنية • التعليم العالي يطور مناهجه • الصحة تعلن عن إنجازات جديدة • الرياضة تحقق إنجازات عالمية • الاقتصاد ينمو بنسبة قياسية'
                        : 'President announces new economic reform plan • Government launches new program • Central Bank announces important decisions • Major companies invest in technology • Higher education develops curricula • Health announces new achievements • Sports achieves global achievements • Economy grows at record rate'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search - Dropdown */}
      {mobileSearchOpen && (
        <div className="w-full md:hidden bg-white border-t border-gray-200 py-3 shadow-md">
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
        <div className="w-full md:hidden bg-white border-t border-gray-200">
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
                    {/* Show subcategories in mobile menu */}
                    {category.children && category.children.length > 0 && (
                      <ul className="ml-4 mt-2 space-y-2">
                        {category.children.map((child) => (
                          <li key={child.slug}>
                            <Link
                              href={`/categories/${child.slug}`}
                              className="text-sm text-gray-500 hover:text-amber-600 transition-colors"
                              onClick={toggleMobileMenu}
                            >
                              {isRTL ? child.name.ar : child.name.en}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
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