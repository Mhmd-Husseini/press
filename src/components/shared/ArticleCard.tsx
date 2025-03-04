'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDateLocalized } from '@/lib/utils';

interface ArticleCardProps {
  id: string;
  title: string;
  summary?: string;
  slug: string;
  imageUrl?: string;
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
  authorName,
  category,
  publishedAt,
  featured = false,
  size = 'medium',
  variant = 'vertical',
  priority = false,
  locale = 'en'
}: ArticleCardProps) => {
  const [currentLocale, setCurrentLocale] = useState(locale);
  
  useEffect(() => {
    // Get current locale from cookie if not provided as prop
    if (locale === 'en') {
      const cookieLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1];
      
      if (cookieLocale) {
        setCurrentLocale(cookieLocale);
      }
    }
  }, [locale]);

  const isRTL = currentLocale === 'ar';

  // Text translations
  const translations = {
    en: {
      noImage: 'No image',
      readMore: 'Read more',
      phoenixStaff: 'Phoenix Staff',
    },
    ar: {
      noImage: 'لا توجد صورة',
      readMore: 'اقرأ المزيد',
      phoenixStaff: 'فريق فينيكس',
    }
  };

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
      return `${baseClasses} flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start`;
    }
    
    if (featured) {
      return `${baseClasses} relative ${isRTL ? 'border-r-4 border-r-red-600' : 'border-l-4 border-l-red-600'}`;
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

  const imageDimensions = getImageDimensions();
  
  if (variant === 'horizontal') {
    return (
      <article className={getCardClasses()} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Image on the left */}
        <div className="flex-shrink-0" style={{ width: imageDimensions.width }}>
          <Link href={`/posts/${slug}`} className="block relative" style={{ height: imageDimensions.height }}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                priority={priority}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xs">{isRTL ? translations.ar.noImage : translations.en.noImage}</span>
              </div>
            )}
          </Link>
        </div>
        
        {/* Content on the right */}
        <div className={`flex-grow p-3 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h3 className={getTitleClass()}>
            <Link href={`/posts/${slug}`} className="text-gray-900 hover:text-blue-600 transition-colors">
              {title}
            </Link>
          </h3>
          
          <div className={`flex ${isRTL ? 'flex-row-reverse justify-between' : 'justify-between'} items-center text-xs text-gray-500`}>
            {category && (
              <Link 
                href={`/categories/${category.slug}`}
                className={`text-blue-600 hover:text-blue-800 ${isRTL ? 'ml-2' : 'mr-2'}`}
              >
                {category.name}
              </Link>
            )}
            <span>{formatDateLocalized(publishedAt, currentLocale)}</span>
          </div>
        </div>
      </article>
    );
  }
  
  // Vertical card layout
  return (
    <article className={getCardClasses()} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Image container */}
      <div className="relative" style={{ height: imageDimensions.height }}>
        <Link href={`/posts/${slug}`} className="block relative h-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">{isRTL ? translations.ar.noImage : translations.en.noImage}</span>
            </div>
          )}
        </Link>
        
        {/* Category tag - displayed outside of the Link */}
        {category && (
          <div className={`absolute bottom-3 ${isRTL ? 'right-3' : 'left-3'} z-10`}>
            <Link 
              href={`/categories/${category.slug}`}
              className="text-xs font-medium text-white hover:text-amber-300 uppercase tracking-wider bg-black bg-opacity-70 px-2 py-1 rounded-sm"
            >
              {category.name}
            </Link>
          </div>
        )}
      </div>
      
      {/* Content section */}
      <div className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h3 className={getTitleClass()}>
          <Link href={`/posts/${slug}`} className="text-gray-900 hover:text-blue-600 transition-colors">
            {title}
          </Link>
        </h3>
        
        {summary && size !== 'small' && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {summary}
          </p>
        )}
        
        <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center text-xs text-gray-500`}>
          <span>{authorName || (isRTL ? translations.ar.phoenixStaff : translations.en.phoenixStaff)}</span>
          <span>{formatDateLocalized(publishedAt, currentLocale)}</span>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard; 