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
  
  // Filter to show only featured or main categories (limit to 6)
  const featuredCategories = categories.slice(0, 8);
  
  const isRTL = locale === 'ar';

  // Use featured posts if available, otherwise use the single featuredStory
  const slidePosts = featuredPosts.length > 0 ? 
    featuredPosts.slice(0, 6) : // Show latest 6 featured posts
    (featuredStory ? [featuredStory] : []);

  // State for the slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = slidePosts.length;

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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

  // Touch event handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Set up auto-advancing timer (10 seconds - a bit faster for news)
  useEffect(() => {
    if (totalSlides <= 1) return; // Don't auto-advance if there's only one slide

    const timer = setInterval(() => {
      nextSlide();
    }, 10000);

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
      readFullStory: 'Read More',
      liveUpdates: 'Live Updates',
      breakingNews: 'Breaking News',
      stayTuned: 'Stay tuned for the latest updates from around the world.',
      news: 'News',
      next: 'Next',
      previous: 'Previous',
      featuredStories: 'Featured Stories',
      topStories: 'Top Stories'
    },
    ar: {
      breaking: 'عاجل:',
      readFullStory: 'اقرأ المزيد',
      liveUpdates: 'تحديثات مباشرة',
      breakingNews: 'أخبار عاجلة',
      stayTuned: 'ترقبوا آخر التحديثات من جميع أنحاء العالم.',
      news: 'أخبار',
      next: 'التالي',
      previous: 'السابق',
      featuredStories: 'القصص المميزة',
      topStories: 'أهم الأخبار'
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

  const imageUrl = story.media && story.media.length > 0 ? story.media[0].media?.url : null;
  const title = getTitle(story);
  const summary = getSummary(story);
  const slug = getSlug(story);
  const categoryName = getCategoryName(story);
  const categorySlug = getCategorySlug(story);

  // Split featured posts for different sections
  const mainPosts = slidePosts.slice(0, Math.min(6, slidePosts.length));
  
  return (
    <section className="bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Breaking news bar - Al Arabiya Style */}
      {breakingStory && (
        <div className="bg-accent py-2 sticky top-0 z-50 shadow-md" style={{ minHeight: '40px' }}>
          <div className="container mx-auto px-4">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="bg-primary-bg text-white px-3 py-1 font-bold text-sm">
                {isRTL ? translations.ar.breaking : translations.en.breaking}
              </div>
              <div className={`mx-3 flex-1 overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}>
                <Link 
                  href={`/posts/${getSlug(breakingStory)}`} 
                  className="text-white font-medium hover:underline text-sm md:text-base inline-block whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                >
                  {getTitle(breakingStory)}
                </Link>
              </div>
              <Link 
                href="/breaking" 
                className="text-white text-xs hover:underline md:inline-block hidden"
              >
                {isRTL ? 'المزيد من الأخبار العاجلة' : 'More Breaking News'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main hero layout - Al Arabiya style with 70/30 split */}
      <div className="container mx-auto px-4 pt-4 ">
        <div className={`flex flex-col md:flex-row gap-6`}>
          {/* Featured story - Takes ~54% width (equivalent to 6.5/12) */}
          <div className="md:w-[54%] flex flex-col">
            {/* Main featured story with navigation controls */}
            <div className="relative overflow-hidden rounded-sm flex-grow">
              {/* Full-width image */}
              <div 
                className="relative h-[70vh] w-full"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200"></div>
                )}
                
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                
                {/* Category badge */}
                {categoryName && (
                  <Link 
                    href={`/categories/${categorySlug}`}
                    className="absolute top-4 left-4 bg-accent text-white text-xs px-3 py-1 font-medium z-10"
                  >
                    {categoryName}
                  </Link>
                )}
                
                {/* Navigation controls for desktop */}
                {totalSlides > 1 && (
                  <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-4 z-10">
                    <button 
                      onClick={prevSlide}
                      className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors focus:outline-none"
                      aria-label={isRTL ? translations.ar.previous : translations.en.previous}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={nextSlide}
                      className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors focus:outline-none"
                      aria-label={isRTL ? translations.ar.next : translations.en.next}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-4 leading-tight text-white">
                      {title}
                    </h1>
                    
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-gray-300 text-xs">
                        {formatDateLocalized(story.publishedAt || story.createdAt, locale)}
                      </span>
                      
                      <Link 
                        href={`/posts/${slug}`} 
                        className="bg-accent hover:bg-accent/90 text-white px-4 py-2 text-sm font-medium transition-colors"
                      >
                        {isRTL ? translations.ar.readFullStory : translations.en.readFullStory}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Slider dots navigation */}
            {totalSlides > 1 && (
              <div className={`flex justify-center mt-4 ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                {slidePosts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      currentSlide === index 
                        ? 'w-6 bg-accent' 
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Side stories column - Takes ~46% width (equivalent to 5.5/12) */}
          <div className="md:w-[46%] flex flex-col">
            <div className="bg-white pb-2 mb-4 border-b-2 border-primary-bg">
              <h2 className={`text-primary-bg font-bold text-lg ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? translations.ar.topStories : translations.en.topStories}
              </h2>
            </div>
            
            {/* Fixed height container to prevent layout shifts */}
            <div className="flex flex-col flex-grow overflow-hidden">
              <div className="flex flex-col space-y-4 flex-grow">
                {/* Side stories - Always show exactly 4 posts */}
                {(() => {
                  // Get all posts except the current slide, then take the first 4
                  const sideStories = mainPosts
                    .map((post, index) => ({ post, originalIndex: index }))
                    .filter(({ originalIndex }) => originalIndex !== currentSlide)
                    .slice(0, 4) // Always show exactly 4 posts
                    .map(({ post, originalIndex }) => ({ post, originalIndex }));

                  return sideStories.map(({ post, originalIndex }) => {
                    const postTitle = getTitle(post);
                    const postSlug = getSlug(post);
                    const postCategoryName = getCategoryName(post);
                    const postDate = post.publishedAt || post.createdAt;
                    
                    return (
                      <div 
                        key={post.id} 
                        className={`group cursor-pointer border-b border-gray-200 pb-4 last:border-0 flex-shrink-0`}
                        onClick={() => goToSlide(originalIndex)}
                      >
                        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {/* Thumbnail */}
                          {post.media && post.media.length > 0 ? (
                            <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded">
                              <Image
                                src={post.media[0].media?.url || '/images/default-post-image.svg'}
                                alt={postTitle}
                                fill
                                className="object-cover"
                                sizes="112px"
                              />
                            </div>
                          ) : (
                            <div className="relative h-20 w-28 flex-shrink-0 bg-gray-200 rounded"></div>
                          )}
                          
                          {/* Post details */}
                          <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {postCategoryName && (
                              <span className="text-xs text-accent font-medium mb-1 block">
                                {postCategoryName}
                              </span>
                            )}
                            
                            <h3 className="text-sm font-medium text-primary-bg group-hover:text-accent transition-colors line-clamp-3 leading-tight">
                              {postTitle}
                            </h3>
                            
                            <span className="text-xs text-gray-500 mt-1 block">
                              {formatDateLocalized(postDate, locale)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 