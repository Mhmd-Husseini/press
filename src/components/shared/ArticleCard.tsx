'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDateLocalized } from '@/lib/utils';

interface ArticleCardProps {
  id: string;
  title: string;
  summary?: string;
  slug: string;
  imageUrl?: string;
  media?: { id: string; url: string; title: string | null; caption: string | null; type: string; mimeType: string | null; }[];
  authorName?: string;
  category?: {
    name: string;
    slug: string;
  };
  publishedAt: string;
  featured?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'vertical' | 'horizontal';
  priority?: boolean;
  locale?: string;
}

export const ArticleCard = ({
  id,
  title,
  summary,
  slug,
  imageUrl,
  media,
  authorName,
  category,
  publishedAt,
  featured = false,
  size = 'medium',
  variant = 'vertical',
  priority = false,
  locale = 'en',
}: ArticleCardProps) => {
  // Helper function for image dimensions based on size and variant
  const getImageDimensions = () => {
    switch(size) {
      case 'small':
        return variant === 'horizontal' ? { width: '100px', height: '70px' } : { width: '100%', height: '160px' };
      case 'large':
        return { width: '100%', height: '320px' };
      case 'medium':
      default:
        return { width: '100%', height: '200px' };
    }
  };

  // Helper function for card classes based on size and variant
  const getCardClasses = () => {
    const baseClasses = 'bg-white border border-gray-100 overflow-hidden transition-shadow duration-200 hover:shadow-md';
    
    if (variant === 'horizontal') {
      return `${baseClasses} flex items-start`;
    }
    
    if (featured) {
      return `${baseClasses} relative border-l-4 border-l-red-600`;
    }
    
    return baseClasses;
  };
  
  // Helper function for title classes based on size
  const getTitleClass = () => {
    switch(size) {
      case 'small':
        return 'text-base font-semibold line-clamp-2 mb-1';
      case 'large':
        return 'text-2xl font-bold line-clamp-3 mb-2';
      case 'medium':
      default:
        return 'text-xl font-bold line-clamp-2 mb-2';
    }
  };

  const cardClasses = getCardClasses();
  const titleClass = getTitleClass();
  const imageDimensions = getImageDimensions();
  const defaultImageUrl = '/images/default-post-image.svg';
  
  // Determine if content should be RTL based on locale
  const isRTL = locale === 'ar';

  if (variant === 'horizontal') {
    return (
      <article className={cardClasses}>
        {/* Image on the left */}
        <div className="flex-shrink-0" style={{ width: imageDimensions.width }}>
          <Link href={`/posts/${encodeURIComponent(slug)}`} className="block relative" style={{ height: imageDimensions.height }}>
            <Image
              src={imageUrl || defaultImageUrl}
              alt={title}
              fill
              className="object-fill w-full h-full"
              priority={priority}
              style={{ objectPosition: 'center' }}
            />
          </Link>
        </div>
        
        {/* Content on the right */}
        <div className="flex-grow p-3">
          <h3 className={titleClass}>
            <Link href={`/posts/${encodeURIComponent(slug)}`} className="text-gray-900 hover:text-blue-600 transition-colors">
              {title}
            </Link>
          </h3>
          
          <div className="flex justify-between items-center text-xs text-gray-500">
            {category && (
              <Link 
                href={`/categories/${encodeURIComponent(category.slug)}`}
                className="text-blue-600 hover:text-blue-800 mr-2"
              >
                {category.name}
              </Link>
            )}
            <span className={`text-gray-500 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>
              {formatDateLocalized(publishedAt, locale)}
            </span>
          </div>
        </div>
      </article>
    );
  }
  
  // Vertical card layout
  return (
    <article className={cardClasses}>
      {/* Image container */}
      <div className="relative" style={{ height: imageDimensions.height }}>
        <Link href={`/posts/${encodeURIComponent(slug)}`} className="block relative h-full">
          <Image
            src={imageUrl || defaultImageUrl}
            alt={title}
            fill
            className="object-fill w-full h-full"
            priority={priority}
          />
        </Link>
        
        {/* Category tag - displayed outside of the Link */}
        {category && (
          <div className="absolute bottom-3 left-3 z-10">
            <Link
              href={`/categories/${encodeURIComponent(category.slug)}`}
              className="text-xs font-medium text-white uppercase tracking-wider bg-red-800 px-2 py-1 rounded"
            >
              {category.name}
            </Link>
          </div>
        )}
      </div>
      
      {/* Content section */}
      <div className="p-4">
        <h3 className={titleClass}>
          <Link href={`/posts/${encodeURIComponent(slug)}`} className="text-gray-900 hover:text-blue-600 transition-colors">
            {title}
          </Link>
        </h3>
        
        {summary && size !== 'small' && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {summary}
          </p>
        )}
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{authorName || 'Phoenix Staff'}</span>
          <span className={`text-gray-500 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>
            {formatDateLocalized(publishedAt, locale)}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard; 