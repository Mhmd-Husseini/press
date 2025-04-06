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
    <section className="relative bg-gray-100 text-gray-800" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section with 60/40 split */}
      <div className="relative w-full">
        {/* Container for the split layout - flex on desktop, stack on mobile */}
        <div className={`flex flex-col md:flex-row ${isRTL ? 'md:flex-row-reverse' : ''} h-auto md:h-[525px]`}>
          {/* Main featured story - full width on mobile, 60% on desktop */}
          <div className="relative w-full md:w-[70%] h-[400px] md:h-full">
            {/* Current featured story */}
            <div className="relative h-full">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={getImageAlt(story.media, title)}
                  fill
                  priority
                  className="object-cover w-full h-full"
                  sizes="(max-width: 768px) 100vw, 70vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200"></div>
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/60 to-transparent"></div>
              
              {/* Navigation arrows for the slider only on mobile */}
              {totalSlides > 1 && (
                <div className="md:hidden">
                  <button 
                    onClick={prevSlide}
                    className={`absolute z-20 top-1/2 ${isRTL ? 'right-4' : 'left-4'} -translate-y-1/2 bg-white/70 p-2 rounded-full hover:bg-white/90 transition-colors focus:outline-none`}
                    aria-label={isRTL ? translations.ar.previous : translations.en.previous}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-800 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={nextSlide}
                    className={`absolute z-20 top-1/2 ${isRTL ? 'left-4' : 'right-4'} -translate-y-1/2 bg-white/70 p-2 rounded-full hover:bg-white/90 transition-colors focus:outline-none`}
                    aria-label={isRTL ? translations.ar.next : translations.en.next}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-800 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Content overlay for the main story */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                  {categoryName && (
                    <Link 
                      href={`/categories/${categorySlug}`}
                      className="inline-block bg-red-800 text-white text-sm px-3 py-1 rounded-md mb-2 font-medium"
                    >
                      {categoryName}
                    </Link>
                  )}
                  
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight text-white">
                    {title}
                  </h1>
                  
                  <p className="text-gray-100 text-sm md:text-base mb-4 line-clamp-2">
                    {summary}
                  </p>
                  
                  <Link 
                    href={`/posts/${slug}`} 
                    className="inline-block bg-white text-gray-800 hover:bg-gray-200 px-4 py-2 text-sm md:text-base rounded-md font-medium"
                  >
                    {isRTL ? translations.ar.readFullStory : translations.en.readFullStory}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Featured headlines sidebar - full width on mobile, 40% on desktop */}
          <div className="relative w-full md:w-[40%] bg-white border-l border-gray-200">
            <div className="p-4 md:p-6">
              {/* Section heading */}
              <h2 className={`text-xl font-bold mb-4 pb-2 border-b border-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'أبرز العناوين' : 'Featured Headlines'}
              </h2>
              
              {/* List of featured headlines */}
              <div className="space-y-3 md:space-y-4">
                {featuredPosts.map((post, index) => {
                  // Skip the first post as it's shown in the main feature area
                  const postTitle = getTitle(post);
                  const postSlug = getSlug(post);
                  const postCategoryName = getCategoryName(post);
                  const postDate = post.publishedAt || post.createdAt;
                  
                  return (
                    <div 
                      key={post.id} 
                      className={`group cursor-pointer ${index < featuredPosts.length - 1 ? 'pb-3 md:pb-4 border-b border-gray-200' : ''}`}
                      onClick={() => goToSlide(index )}
                    >
                      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {/* Thumbnail image */}
                        {post.media && post.media.length > 0 ? (
                          <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden">
                            <Image
                              src={post.media[0].url}
                              alt={getImageAlt(post.media, postTitle)}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-gray-200 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Post details */}
                        <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {postCategoryName && (
                            <span className="text-xs text-red-800 font-medium mb-1 block">
                              {postCategoryName}
                            </span>
                          )}
                          
                          <h3 className="text-sm md:text-base font-medium text-gray-800 group-hover:text-red-800 transition-colors line-clamp-2">
                            {postTitle}
                          </h3>
                          
                          <span className="text-xs text-gray-500 mt-1 block">
                            {formatDateLocalized(postDate, locale)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* View all link */}
              <div className={`mt-4 ${isRTL ? 'text-left' : 'text-right'}`}>
              </div>
            </div>
          </div>
        </div>
        
        {/* Breaking news alert on top */}
        {breakingStory && (
          <div className="absolute top-4 left-0 right-0 z-10">
            <div className="container mx-auto px-4">
              <div className={`px-4 py-2 rounded-md inline-flex items-center ${isRTL ? 'float-right' : 'float-left'}`} style={{ backgroundColor: '#DF1919' }}>
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
      </div>
      
      {/* Featured categories navigation */}
      <div className="bg-gray-50 border-t border-gray-200 py-3">
        <div className="container mx-auto px-4">
          <div className={`flex items-center overflow-x-auto scrollbar-hide ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            {loadingCategories ? (
              // Show skeleton loaders while categories are loading
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-6 w-20 mx-2 rounded"></div>
                ))}
              </>
            ) : (
              // Show the categories once loaded
              featuredCategories.map((category) => (
                <Link 
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="text-gray-600 hover:text-red-800 whitespace-nowrap px-4 py-1 text-sm font-medium"
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