'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getLocalizedValue, formatDateLocalized } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { getImageUrl, getImageAlt } from '@/lib/imageUtils';

// Define the props interface for the HeroSection
export interface HeroProps {
  featuredStory: any;
  breakingStory?: any;
  locale?: string;
  featuredPosts?: any[]; // Add featured posts prop
}

const HeroSection: React.FC<HeroProps> = ({ 
  featuredStory,
  breakingStory,
  locale = 'en',
  featuredPosts = [] // Default to empty array
}) => {
  // Fetch categories from the database
  const { categories, loading: loadingCategories } = useCategories(locale);
  
  // Filter to show only featured or main categories (limit to 5-6)
  const featuredCategories = categories.slice(0, 6);
  
  const isRTL = locale === 'ar';

  // Use featured posts if available, otherwise use the single featuredStory
  const slidePosts = featuredPosts.length > 0 ? 
    featuredPosts.slice(0, 6) : // Show latest 6 featured posts
    (featuredStory ? [featuredStory] : []);

  // State for the slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = slidePosts.length;

  // Function to advance to the next slide
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // Function to go to the previous slide
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Function to go to a specific slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Set up auto-advancing timer (15 seconds)
  useEffect(() => {
    if (totalSlides <= 1) return; // Don't auto-advance if there's only one slide

    const timer = setInterval(() => {
      nextSlide();
    }, 15000);

    return () => clearInterval(timer); // Cleanup on unmount
  }, [nextSlide, totalSlides]);

  // Helper functions to get localized content
  const getTitle = (story: any) => {
    if (!story) return '';
    return getLocalizedValue(story.translations, locale, 'en', 'title' as any) || '';
  };

  const getSummary = (story: any) => {
    if (!story) return '';
    return getLocalizedValue(story.translations, locale, 'en', 'summary' as any) || '';
  };

  const getSlug = (story: any) => {
    if (!story) return '';
    const translation = story.translations.find((t: any) => t.locale === locale) 
      || story.translations.find((t: any) => t.locale === 'en') 
      || story.translations[0];
    return translation?.slug || '';
  };

  const getCategoryName = (story: any) => {
    if (!story?.category?.translations) return '';
    return getLocalizedValue(story.category.translations, locale, 'en', 'name' as any) || '';
  };

  const getCategorySlug = (story: any) => {
    if (!story?.category?.translations) return '';
    const translation = story.category.translations.find((t: any) => t.locale === locale) 
      || story.category.translations.find((t: any) => t.locale === 'en') 
      || story.category.translations[0];
    return translation?.slug || '';
  };

  // Text translations
  const translations = {
    en: {
      breaking: 'BREAKING:',
      readFullStory: 'View Full Article 📰',
      liveUpdates: 'Live Updates',
      breakingNews: 'Breaking News',
      stayTuned: 'Stay tuned for the latest updates from around the world.',
      news: 'News',
      next: 'Next',
      previous: 'Previous'
    },
    ar: {
      breaking: 'عاجل:',
      readFullStory: ' 📰 عرض الخبر كاملا',
      liveUpdates: 'تحديثات مباشرة',
      breakingNews: 'أخبار عاجلة',
      stayTuned: 'ترقبوا آخر التحديثات من جميع أنحاء العالم.',
      news: 'أخبار',
      next: 'التالي',
      previous: 'السابق'
    }
  };

  // If no slides are available, use a placeholder
  const story = slidePosts[currentSlide] || {
    translations: [{ 
      title: isRTL ? translations.ar.breakingNews : translations.en.breakingNews, 
      summary: isRTL ? translations.ar.stayTuned : translations.en.stayTuned, 
      locale: isRTL ? 'ar' : 'en', 
      slug: '' 
    }],
    category: { 
      translations: [{ 
        name: isRTL ? translations.ar.news : translations.en.news, 
        slug: 'news', 
        locale: isRTL ? 'ar' : 'en' 
      }] 
    },
    media: []
  };

  const imageUrl = story.media && story.media.length > 0 ? story.media[0].url : null;
  const title = getTitle(story);
  const summary = getSummary(story);
  const slug = getSlug(story);
  const categoryName = getCategoryName(story);
  const categorySlug = getCategorySlug(story);

  return (
    <section className="relative bg-gray-900 text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Image */}
      <div className="relative h-[500px] md:h-[600px] w-full">
        {/* Image for current slide with fade transition */}
        <div className="absolute inset-0 transition-opacity duration-500">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={getImageAlt(story.media, title)}
              fill
              priority
              className="object-fill w-full h-full"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-800"></div>
          )}
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
        
        {/* Navigation arrows for the slider */}
        {totalSlides > 1 && (
          <>
            <button 
              onClick={prevSlide}
              className={`absolute z-20 top-1/2 ${isRTL ? 'right-4' : 'left-4'} -translate-y-1/2 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors focus:outline-none`}
              aria-label={isRTL ? translations.ar.previous : translations.en.previous}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={nextSlide}
              className={`absolute z-20 top-1/2 ${isRTL ? 'left-4' : 'right-4'} -translate-y-1/2 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors focus:outline-none`}
              aria-label={isRTL ? translations.ar.next : translations.en.next}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        
        {/* Breaking news alert on top */}
        {breakingStory && (
          <div className="absolute top-4 left-0 right-0 z-10">
            <div className="container mx-auto px-4">
              <div className={`bg-red-600 px-4 py-2 rounded-md inline-flex items-center ${isRTL ? 'float-right' : 'float-left'}`}>
                <span className={`font-bold ${isRTL ? 'ml-2' : 'mr-2'}`}>
                  {isRTL ? translations.ar.breaking : translations.en.breaking}
                </span>
                <Link href={`/posts/${getSlug(breakingStory)}`} className="hover:underline">
                  {getTitle(breakingStory)}
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 pb-8 md:pb-12 z-10">
          <div className="container mx-auto px-4">
            {/* Ensure proper content alignment for RTL */}
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <div className={`max-w-3xl ${isRTL ? 'ml-auto' : 'mr-auto'}`}>
                {categoryName && (
                  <Link 
                    href={`/categories/${categorySlug}`}
                    className="inline-block bg-red-600 text-white text-sm px-3 py-1 rounded-md mb-4 font-medium"
                  >
                    {categoryName}
                  </Link>
                )}
                
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                  {title}
                </h1>
                
                <p className="text-gray-200 text-lg mb-6 line-clamp-2">
                  {summary}
                </p>
                
                {/* Button container with proper RTL alignment */}
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <Link 
                    href={`/posts/${slug}`} 
                    className="inline-block bg-white text-gray-900 hover:bg-gray-200 px-5 py-2 rounded-md font-medium"
                  >
                    {isRTL ? translations.ar.readFullStory : translations.en.readFullStory}
                  </Link>
                  
                  {breakingStory && (
                    <Link 
                      href="/breaking" 
                      className={`inline-block ${isRTL ? 'mr-3' : 'ml-3'} bg-transparent border border-white text-white hover:bg-white hover:text-gray-900 px-5 py-2 rounded-md font-medium transition-colors`}
                    >
                      {isRTL ? translations.ar.liveUpdates : translations.en.liveUpdates}
                    </Link>
                  )}
                </div>
              </div>
            </div>
            
            {/* Slide indicators */}
            {totalSlides > 1 && (
              <div className="flex justify-center mt-6">
                {slidePosts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 w-2 mx-1 rounded-full ${
                      currentSlide === index ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Featured categories navigation */}
      <div className="bg-gray-800 py-3">
        <div className="container mx-auto px-4">
          <div className={`flex items-center overflow-x-auto scrollbar-hide ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            {loadingCategories ? (
              // Show skeleton loaders while categories are loading
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-700 h-6 w-20 mx-2 rounded"></div>
                ))}
              </>
            ) : (
              // Show the categories once loaded
              featuredCategories.map((category) => (
                <Link 
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="text-gray-300 hover:text-white whitespace-nowrap px-4 py-1 text-sm font-medium"
                >
                  {isRTL ? category.name.ar : category.name.en}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 