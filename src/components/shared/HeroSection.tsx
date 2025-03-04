'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getLocalizedValue } from '@/lib/utils';

// Define the props interface for the HeroSection
export interface HeroProps {
  featuredStory: any;
  breakingStory?: any;
  locale?: string;
}

const HeroSection: React.FC<HeroProps> = ({ 
  featuredStory,
  breakingStory,
  locale = 'en'
}) => {
  const isRTL = locale === 'ar';

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
      readFullStory: 'Read Full Story',
      liveUpdates: 'Live Updates',
      breakingNews: 'Breaking News',
      stayTuned: 'Stay tuned for the latest updates from around the world.',
      news: 'News'
    },
    ar: {
      breaking: 'عاجل:',
      readFullStory: 'اقرأ القصة كاملة',
      liveUpdates: 'تحديثات مباشرة',
      breakingNews: 'أخبار عاجلة',
      stayTuned: 'ترقبوا آخر التحديثات من جميع أنحاء العالم.',
      news: 'أخبار'
    }
  };

  // If no featured story provided, use a placeholder
  const story = featuredStory || {
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

  // Featured categories for navigation
  const featuredCategories = [
    { name: { en: 'World', ar: 'العالم' }, slug: 'world' },
    { name: { en: 'Politics', ar: 'السياسة' }, slug: 'politics' },
    { name: { en: 'Business', ar: 'الأعمال' }, slug: 'business' },
    { name: { en: 'Technology', ar: 'التكنولوجيا' }, slug: 'technology' },
    { name: { en: 'Entertainment', ar: 'الترفيه' }, slug: 'entertainment' },
    { name: { en: 'Sports', ar: 'الرياضة' }, slug: 'sports' }
  ];

  return (
    <section className="relative bg-gray-900 text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Image */}
      <div className="relative h-[500px] md:h-[600px] w-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            className="object-cover opacity-50"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
        
        {/* Breaking news alert on top */}
        {breakingStory && (
          <div className="absolute top-4 left-0 right-0 z-10">
            <div className="container mx-auto px-4">
              <div className={`bg-red-600 px-4 py-2 rounded-md inline-flex items-center ${isRTL ? 'justify-end' : 'justify-start'}`}>
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
        <div className={`absolute bottom-0 left-0 right-0 pb-8 md:pb-12 z-10 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="container mx-auto px-4">
            <div className={`max-w-3xl ${isRTL ? 'mr-auto ml-0' : 'ml-0'}`}>
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
              
              <div className={`flex flex-wrap gap-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                <Link 
                  href={`/posts/${slug}`} 
                  className="bg-white text-gray-900 hover:bg-gray-200 px-5 py-2 rounded-md font-medium"
                >
                  {isRTL ? translations.ar.readFullStory : translations.en.readFullStory}
                </Link>
                
                {breakingStory && (
                  <Link 
                    href="/breaking" 
                    className="bg-transparent border border-white text-white hover:bg-white hover:text-gray-900 px-5 py-2 rounded-md font-medium transition-colors"
                  >
                    {isRTL ? translations.ar.liveUpdates : translations.en.liveUpdates}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured categories navigation */}
      <div className="bg-gray-800 py-3">
        <div className="container mx-auto px-4">
          <div className={`flex items-center overflow-x-auto scrollbar-hide ${isRTL ? 'justify-end' : 'justify-start'}`}>
            {featuredCategories.map((category) => (
              <Link 
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="text-gray-300 hover:text-white whitespace-nowrap px-4 py-1 text-sm font-medium"
              >
                {isRTL ? category.name.ar : category.name.en}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 