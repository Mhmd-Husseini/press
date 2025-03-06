'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { setLanguage } from '@/app/actions';
import { useCategories } from '@/hooks/useCategories';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');
  const [currentDate, setCurrentDate] = useState('');
  
  // Fetch categories from the API using our custom hook
  const { categories, loading, error } = useCategories(currentLocale);

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
  };

  const isRTL = currentLocale === 'ar';
  
  // Use database categories or fallback if loading/error
  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  return (
    <header className="bg-gray-900 text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="bg-gray-950 py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className={`text-sm text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
              {currentDate}
            </div>
            <div className={`flex ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'} text-sm`}>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                {isRTL ? 'اتصل بنا' : 'Contact Us'}
              </Link>
              <button
                onClick={() => switchLanguage(isRTL ? 'en' : 'ar')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isRTL ? 'English' : 'العربية'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className={`relative h-10 w-10 ${isRTL ? 'ml-2' : 'mr-2'}`}>
                <Image
                  src="/phoenix-logo.svg"
                  alt="Phoenix Press"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">Phoenix</span>
                <span className={`text-amber-400 ${isRTL ? 'mr-1' : 'ml-1'}`}>Press</span>
              </div>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder={isRTL ? 'ابحث عن الأخبار' : 'Search for news'}
                className={`bg-gray-800 text-white px-4 py-2 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-amber-500 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              <button className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="hidden md:flex items-center justify-between h-12">
            <ul className={`flex ${isRTL ? 'space-x-reverse space-x-6' : 'space-x-6'}`}>
              {loading ? (
                // Show skeleton loaders while categories are loading
                <>
                  {[1, 2, 3].map((i) => (
                    <li key={i} className="animate-pulse">
                      <div className="h-4 w-16 bg-gray-700 rounded"></div>
                    </li>
                  ))}
                </>
              ) : (
                // Show actual categories once loaded
                displayCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="hover:text-primary-400 transition-colors"
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
      <div className="bg-red-600 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <span className={`text-white font-bold uppercase text-xs ${isRTL ? 'ml-3' : 'mr-3'} px-2 py-1 bg-red-700 rounded`}>
              {isRTL ? 'عاجل' : 'Breaking'}
            </span>
            <span className={`text-white text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL 
                ? 'الرئيس يعلن عن خطة جديدة للإصلاح الاقتصادي تشمل استثمارات بقيمة 50 مليار دولار' 
                : 'President announces new economic reform plan with $50 billion investment package'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800">
          <div className="container mx-auto px-4 py-4">
            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder={isRTL ? 'ابحث عن الأخبار' : 'Search for news'}
                className={`bg-gray-700 text-white px-4 py-2 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-amber-500 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              <button className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            {/* Categories */}
            <ul className={`space-y-3 pb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {loading ? (
                // Show skeleton loaders while categories are loading
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={i} className="animate-pulse">
                      <div className="h-4 w-24 bg-gray-700 rounded"></div>
                    </li>
                  ))}
                </>
              ) : (
                // Show actual categories once loaded
                displayCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="text-gray-300 hover:text-white transition-colors"
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