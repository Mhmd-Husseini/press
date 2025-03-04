'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostWithRelations } from '@/lib/services/post.service';
import { formatDateLocalized, getLocalizedValue } from '@/lib/utils';
import ArticleCard from './ArticleCard';

interface FeaturedPostsSectionProps {
  posts: PostWithRelations[];
  locale?: string;
  title?: string;
  viewAllLink?: string;
}

export const FeaturedPostsSection = ({ 
  posts,
  locale = 'en',
  title = 'Featured Stories',
  viewAllLink = '/featured'
}: FeaturedPostsSectionProps) => {
  if (!posts || posts.length === 0) {
    return null;
  }

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

  // Get main featured post and the rest
  const mainFeaturedPost = posts[0];
  const secondaryFeaturedPosts = posts.slice(1, 3);
  const remainingPosts = posts.slice(3);

  return (
    <section className="bg-white py-6 md:py-10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-1 h-6 bg-red-600 mr-3"></div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          {viewAllLink && (
            <Link 
              href={viewAllLink} 
              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
            >
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Featured Article - Takes up first column */}
          <div className="lg:col-span-1">
            {mainFeaturedPost && (
              <ArticleCard
                id={mainFeaturedPost.id}
                title={getPostTitle(mainFeaturedPost)}
                summary={getPostSummary(mainFeaturedPost)}
                slug={getPostSlug(mainFeaturedPost)}
                imageUrl={mainFeaturedPost.media && mainFeaturedPost.media[0]?.url}
                authorName={mainFeaturedPost.authorName || getCategoryName(mainFeaturedPost)}
                category={mainFeaturedPost.category ? {
                  name: getCategoryName(mainFeaturedPost),
                  slug: getCategorySlug(mainFeaturedPost)
                } : undefined}
                publishedAt={mainFeaturedPost.publishedAt?.toString() || mainFeaturedPost.createdAt.toString()}
                featured={true}
                size="large"
                priority={true}
              />
            )}
          </div>
          
          {/* Secondary Featured Articles - Takes up second column */}
          <div className="lg:col-span-1 flex flex-col space-y-6">
            {secondaryFeaturedPosts.map((post) => (
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
              />
            ))}
          </div>
          
          {/* Horizontal List - Takes up third column */}
          <div className="lg:col-span-1 border-l border-gray-100 pl-6">
            <div className="space-y-4">
              {remainingPosts.map((post) => (
                <ArticleCard
                  key={post.id}
                  id={post.id}
                  title={getPostTitle(post)}
                  slug={getPostSlug(post)}
                  imageUrl={post.media && post.media[0]?.url}
                  authorName={post.authorName || getCategoryName(post)}
                  category={post.category ? {
                    name: getCategoryName(post),
                    slug: getCategorySlug(post)
                  } : undefined}
                  publishedAt={post.publishedAt?.toString() || post.createdAt.toString()}
                  size="small"
                  variant="horizontal"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPostsSection; 