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
  // Helper functions to get localized content
  const getTitle = (story: any) => {
    if (!story) return '';
    return getLocalizedValue(story.translations, locale, 'en', 'title') || '';
  };

  const getSummary = (story: any) => {
    if (!story) return '';
    return getLocalizedValue(story.translations, locale, 'en', 'summary') || '';
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
    return getLocalizedValue(story.category.translations, locale, 'en', 'name') || '';
  };

  const getCategorySlug = (story: any) => {
    if (!story?.category?.translations) return '';
    const translation = story.category.translations.find((t: any) => t.locale === locale) 
      || story.category.translations.find((t: any) => t.locale === 'en') 
      || story.category.translations[0];
    return translation?.slug || '';
  };

  // If no featured story provided, use a placeholder
  const story = featuredStory || {
    translations: [{ title: 'Breaking News', summary: 'Stay tuned for the latest updates from around the world.', locale: 'en', slug: '' }],
    category: { translations: [{ name: 'News', slug: 'news', locale: 'en' }] },
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
    { name: 'World', slug: 'world' },
    { name: 'Politics', slug: 'politics' },
    { name: 'Business', slug: 'business' },
    { name: 'Technology', slug: 'technology' },
    { name: 'Entertainment', slug: 'entertainment' },
    { name: 'Sports', slug: 'sports' }
  ];

  return (
    <section className="relative bg-gray-900 text-white">
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
              <div className="bg-red-600 px-4 py-2 rounded-md inline-flex items-center">
                <span className="font-bold mr-2">BREAKING:</span>
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
            <div className="max-w-3xl">
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
              
              <div className="flex flex-wrap gap-3">
                <Link 
                  href={`/posts/${slug}`} 
                  className="bg-white text-gray-900 hover:bg-gray-200 px-5 py-2 rounded-md font-medium"
                >
                  Read Full Story
                </Link>
                
                {breakingStory && (
                  <Link 
                    href="/breaking" 
                    className="bg-transparent border border-white text-white hover:bg-white hover:text-gray-900 px-5 py-2 rounded-md font-medium transition-colors"
                  >
                    Live Updates
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
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {featuredCategories.map((category) => (
              <Link 
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="text-gray-300 hover:text-white whitespace-nowrap px-4 py-1 text-sm font-medium"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 