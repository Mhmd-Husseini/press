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

  const getPostContent = (post: PostWithRelations) => {
    return getLocalizedValue(post.translations, locale, 'en', 'content') || '';
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

  // Split posts for different layouts - Al Arabiya style
  const mainPost = sortedPosts[0]; // Main featured post
  const secondaryPosts = sortedPosts.slice(1, 3); // Two secondary posts
  const remainingPosts = sortedPosts.slice(3); // Rest of the posts

  return (
    <section className="bg-white py-6 border-t border-gray-200" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        {/* Section Header - Al Arabiya style with blue background */}
        <div className="mb-4 border-b-2 border-primary-bg pb-2 flex items-center justify-between">
          <h2 className={`text-xl font-bold text-primary-bg ${isRTL ? 'text-right' : 'text-left'}`}>
            {sectionTitle}
          </h2>
          {viewAllLink && (
            <Link 
              href={viewAllLink} 
              className={`text-accent hover:text-accent/80 text-sm font-medium flex items-center `}
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

        {/* Al Arabiya style layout with one main post and multiple smaller posts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main featured post - Spans 5 columns */}
          {mainPost && (
            <div className="lg:col-span-5">
              <div className="h-[620px] flex flex-col border border-gray-200 hover:shadow-md transition-shadow">
                <div className="relative h-96 w-full">
                  {mainPost.media && mainPost.media[0]?.media?.url ? (
                    <Image
                      src={mainPost.media[0].media?.url}
                      alt={getPostTitle(mainPost)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                  {getCategoryName(mainPost) && (
                    <Link 
                      href={`/categories/${getCategorySlug(mainPost)}`}
                      className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} bg-accent text-white text-xs px-2 py-1 font-medium z-10`}
                    >
                      {getCategoryName(mainPost)}
                    </Link>
                  )}
                </div>
                <div className={`p-4 flex-1 flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
                  <Link href={`/posts/${getPostSlug(mainPost)}`}>
                    <h3 className="text-lg font-bold text-primary-bg mb-2 line-clamp-2 hover:text-accent transition-colors leading-tight">
                      {getPostTitle(mainPost)}
                    </h3>
                  </Link>
                  
                  {getPostSummary(mainPost) && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed font-medium">
                      {getPostSummary(mainPost)}
                    </p>
                  )}
                  
                  {getPostContent(mainPost) && (
                    <div 
                      className="text-sm text-gray-700 leading-relaxed overflow-hidden"
                      style={{
                        height: 'calc(100% - 120px)', // Subtract approximate height of title, summary, and footer
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: Math.floor((520 - 288 - 120) / 20) // Calculate lines based on remaining space
                      }}
                    >
                      {getPostContent(mainPost).replace(/<[^>]*>/g, '')}
                    </div>
                  )}
                  
                  {/* Show a placeholder if no summary or content */}
                  {!getPostSummary(mainPost) && !getPostContent(mainPost) && (
                    <div 
                      className="text-sm text-gray-500 flex items-center justify-center bg-gray-50 rounded"
                      style={{ height: 'calc(100% - 120px)' }}
                    >
                      <span className="text-center">
                        {isRTL ? 'اضغط لقراءة المقال كاملاً' : 'Click to read the full article'}
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {formatDateLocalized(String(mainPost.publishedAt || mainPost.createdAt), locale)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Two medium-sized secondary posts - Each spans 3 columns */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            {secondaryPosts.map((post) => (
              <div key={post.id} className="border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
                <div className="relative h-72 w-full">
                  {post.media && post.media[0]?.media?.url ? (
                    <Image
                      src={post.media[0].media.url}
                      alt={getPostTitle(post)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                      <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                  {getCategoryName(post) && (
                    <Link 
                      href={`/categories/${getCategorySlug(post)}`}
                      className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} bg-accent text-white text-xs px-2 py-1 font-medium z-10`}
                    >
                      {getCategoryName(post)}
                    </Link>
                  )}
                </div>
                <div className={`p-3 flex-grow flex flex-col justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div>
                    <Link href={`/posts/${getPostSlug(post)}`}>
                      <h3 className="text-base font-bold text-primary-bg mb-2 line-clamp-2 hover:text-accent transition-colors leading-tight">
                        {getPostTitle(post)}
                      </h3>
                    </Link>
                    {getPostSummary(post) && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {getPostSummary(post)}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
                    {formatDateLocalized(String(post.publishedAt || post.createdAt), locale)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* List of smaller articles - Spans 3 columns */}
          <div className={`lg:col-span-3 border-${isRTL ? 'r' : 'l'} border-gray-200 ${isRTL ? 'pr-4' : 'pl-4'}`}>
            <h3 className={`text-sm font-semibold text-primary-bg mb-3 pb-2 border-b border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'آخر الأخبار' : 'More News'}
            </h3>
            <div className="space-y-4">
              {remainingPosts.map((post) => (
                <div key={post.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <Link href={`/posts/${getPostSlug(post)}`}>
                    <h4 className={`text-sm font-medium text-gray-800 hover:text-accent transition-colors line-clamp-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {getPostTitle(post)}
                    </h4>
                  </Link>
                  <div className={`flex items-center mt-1 ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                    {getCategoryName(post) && (
                      <span className="text-xs text-accent font-medium">
                        {getCategoryName(post)}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDateLocalized(String(post.publishedAt || post.createdAt), locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LatestPostsSection; 