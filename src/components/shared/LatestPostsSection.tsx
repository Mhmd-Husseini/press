'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostWithRelations } from '@/lib/services/post.service';
import { formatDateLocalized, getLocalizedValue } from '@/lib/utils';
import ArticleCard from './ArticleCard';

interface LatestPostsSectionProps {
  posts: PostWithRelations[];
  locale?: string;
  title?: string;
  viewAllLink?: string;
}

export const LatestPostsSection = ({ 
  posts, 
  locale = 'en',
  title = 'Latest News',
  viewAllLink = '/news'
}: LatestPostsSectionProps) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  const isRTL = locale === 'ar';

  // Text translations
  const translations = {
    en: {
      latestNews: 'Latest News',
      viewAll: 'View All'
    },
    ar: {
      latestNews: 'أحدث الأخبار',
      viewAll: 'عرض الكل'
    }
  };

  // Use translated titles if no specific title is provided
  const sectionTitle = title === 'Latest News' ? 
    (isRTL ? translations.ar.latestNews : translations.en.latestNews) : 
    title;

  // Helper functions to get localized content
  const getPostTitle = (post: PostWithRelations) => {
    return getLocalizedValue(post.translations, locale, 'en', 'title') || '';
  };

  const getPostSummary = (post: PostWithRelations) => {
    return getLocalizedValue(post.translations, locale, 'en', 'summary') || '';
  };

  const getPostSlug = (post: PostWithRelations) => {
    const translation = post.translations.find(t => t.locale === locale) 
      || post.translations.find(t => t.locale === 'en') 
      || post.translations[0];
    return translation?.slug || '';
  };

  const getCategoryName = (post: PostWithRelations) => {
    if (!post.category?.translations) return '';
    return getLocalizedValue(post.category.translations, locale, 'en', 'name') || '';
  };

  const getCategorySlug = (post: PostWithRelations) => {
    if (!post.category?.translations) return '';
    const translation = post.category.translations.find(t => t.locale === locale) 
      || post.category.translations.find(t => t.locale === 'en') 
      || post.category.translations[0];
    return translation?.slug || '';
  };

  // Sort posts by publishedAt before rendering
  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.createdAt);
    const dateB = new Date(b.publishedAt || b.createdAt);
    return dateB.getTime() - dateA.getTime(); // newest first
  });

  return (
    <section className="bg-gray-50 py-8 md:py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center">
            <div className={`w-1 h-6 bg-blue-600 ${isRTL ? 'ml-3' : 'mr-3'}`}></div>
            <h2 className={`text-2xl font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
              {sectionTitle}
            </h2>
          </div>
          {viewAllLink && (
            <Link 
              href={viewAllLink} 
              className={`text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isRTL ? translations.ar.viewAll : translations.en.viewAll}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Grid of posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedPosts.map((post) => (
            <ArticleCard
              key={post.id}
              id={post.id}
              title={getPostTitle(post)}
              summary={getPostSummary(post)}
              slug={getPostSlug(post)}
              imageUrl={post.media && post.media[0]?.url}
              authorName={post.authorName || getCategoryName(post)}
              category={post.category ? {
                name: getCategoryName(post),
                slug: getCategorySlug(post)
              } : undefined}
              publishedAt={post.publishedAt?.toString() || post.createdAt.toString()}
              size="medium"
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestPostsSection; 