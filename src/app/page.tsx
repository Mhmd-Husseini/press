import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import HeroSection from '@/components/shared/HeroSection';
import LatestPostsSection from '@/components/shared/LatestPostsSection';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { PostStatus } from '@prisma/client';
import { getLocalizedValue } from '@/lib/utils';

export default async function Home() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const isRTL = locale === 'ar';
  
  // Text translations
  const translations = {
    en: {
      latestNews: "Latest News",
      noPostsInCategory: "No posts in this category yet.",
      more: "More"
    },
    ar: {
      latestNews: "أحدث الأخبار",
      noPostsInCategory: "لا توجد منشورات في هذه الفئة حتى الآن.",
      more: "المزيد"
    }
  };
  
  try {
    // Get featured posts (published & featured)
    const featuredPosts = await prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        featured: true,
        deletedAt: null
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 7,
      include: {
        translations: true,
        category: {
          include: {
            translations: true
          }
        },
        media: true,
        author: true,
        createdBy: true,
        updatedBy: true
      }
    });

    // Get latest posts (published, not necessarily featured)
    const latestPosts = await prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        deletedAt: null
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 8,
      include: {
        translations: true,
        category: {
          include: {
            translations: true
          }
        },
        media: true,
        author: true,
        createdBy: true,
        updatedBy: true
      }
    });

    // Get top categories
    const categoriesWithPosts = await prisma.category.findMany({
      where: {
        deletedAt: null
      },
      include: {
        translations: true,
        posts: {
          where: {
            status: PostStatus.PUBLISHED,
            deletedAt: null
          },
          take: 4,
          orderBy: {
            publishedAt: 'desc'
          },
          include: {
            translations: true,
            media: true
          }
        }
      },
      take: 20
    });

    // Get breaking news (most recent published posts marked as breaking)
    const breakingNews = await prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        metaData: {
          path: ['breaking'],
          equals: true
        },
        deletedAt: null
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 1,
      include: {
        translations: true,
        category: {
          include: {
            translations: true
          }
        },
        media: true,
        author: true,
        createdBy: true,
        updatedBy: true
      }
    });

    const featuredStory = featuredPosts.length > 0 ? featuredPosts[0] : null;
    const breakingStory = breakingNews.length > 0 ? breakingNews[0] : null;

    return (
      <MainLayout>
        <HeroSection 
          featuredStory={featuredStory} 
          breakingStory={breakingStory} 
          locale={locale} 
          featuredPosts={featuredPosts}
        />
        
        <div className="space-y-6 md:space-y-0 md:pb-6" dir={isRTL ? 'rtl' : 'ltr'}>          
          {/* Latest News Section */}
          <LatestPostsSection 
            posts={latestPosts as any[]} 
            locale={locale}
            title={isRTL ? translations.ar.latestNews : translations.en.latestNews}
            viewAllLink="/news"
          />
          
          {/* Category Sections */}
          <div className="bg-white py-8">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {categoriesWithPosts.map((category) => {
                  // Get localized category name
                  const categoryName = category.translations.find(t => t.locale === locale)?.name || 
                                      category.translations.find(t => t.locale === 'en')?.name ||
                                      category.translations[0]?.name || '';
                  
                  // Get localized category slug
                  const categorySlug = category.translations.find(t => t.locale === locale)?.slug || 
                                      category.translations.find(t => t.locale === 'en')?.slug ||
                                      category.translations[0]?.slug || '';
                  
                  // Get posts for this category and ensure they're sorted by date (newest first)
                  const categoryPosts = [...(category.posts || [])].sort((a, b) => {
                    const dateA = new Date(a.publishedAt || a.createdAt);
                    const dateB = new Date(b.publishedAt || b.createdAt);
                    return dateB.getTime() - dateA.getTime();
                  });
                  
                  return (
                    <div key={category.id} className="category-section bg-gray-50 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        {/* Category title section */}
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {isRTL ? (
                            <>
                              <h2 className="text-xl font-bold text-gray-900 text-right pr-3">{categoryName}</h2>
                              <div className="w-1 h-6 bg-gray-700 ml-3"></div>
                            </>
                          ) : (
                            <>
                              <div className="w-1 h-6 bg-gray-700 mr-3"></div>
                              <h2 className="text-xl font-bold text-gray-900 text-left">{categoryName}</h2>
                            </>
                          )}
                        </div>
                        
                        {/* More link section */}
                        <a 
                          href={`/categories/${categorySlug}`} 
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center transition-colors"
                        >
                          {isRTL ? (
                            <>
                              <span>{translations.ar.more}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>{translations.en.more}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </>
                          )}
                        </a>
                      </div>
                      
                      <div className="space-y-4">
                        {categoryPosts.length > 0 ? (
                          categoryPosts.map((post, index) => {
                            // Get localized post title
                            const postTitle = post.translations.find(t => t.locale === locale)?.title || 
                                            post.translations.find(t => t.locale === 'en')?.title ||
                                            post.translations[0]?.title || '';
                            
                            // Get localized post slug
                            const postSlug = post.translations.find(t => t.locale === locale)?.slug || 
                                            post.translations.find(t => t.locale === 'en')?.slug ||
                                            post.translations[0]?.slug || '';
                            
                            // Get post image if available
                            const postImage = post.media && post.media.length > 0 ? post.media[0].url : null;
                            
                            return (
                              <a 
                                key={post.id}
                                href={`/posts/${postSlug}`}
                                className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} pb-3 hover:bg-gray-100 rounded p-2 transition-colors ${index < categoryPosts.length - 1 ? 'border-b border-gray-100' : ''}`}
                              >
                                {/* Post thumbnail */}
                                <div className={`flex-shrink-0 w-20 h-16 relative bg-gray-200 rounded overflow-hidden`}>
                                  {postImage ? (
                                    <img 
                                      src={postImage} 
                                      alt={postTitle} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Post content */}
                                <div className="flex-1">
                                  <h3 className={`text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {postTitle}
                                  </h3>
                                  <span className={`text-xs text-gray-500 ${isRTL ? 'text-right block' : 'text-left'}`}>
                                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </a>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 text-sm">
                            {isRTL ? translations.ar.noPostsInCategory : translations.en.noPostsInCategory}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  } catch (error) {
    console.error('Error loading home page:', error);
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-8">We're experiencing technical difficulties. Please try again later.</p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
            Refresh Page
          </a>
        </div>
      </MainLayout>
    );
  }
} 