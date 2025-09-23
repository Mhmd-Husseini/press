import React from 'react';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import MainLayout from '@/components/layouts/MainLayout';
import prisma from '@/lib/prisma';
import { formatDateLocalized } from '@/lib/utils';
import { MediaType, PostStatus } from '@prisma/client';

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
};

const POSTS_PER_PAGE = 12;

async function fetchPosts(page: number, search: string = '', locale: string) {
  try {
    const skip = (page - 1) * POSTS_PER_PAGE;
    
    const whereClause: any = {
      status: PostStatus.PUBLISHED,
      deletedAt: null,
    };

    // Add search filter if provided
    if (search.trim()) {
      whereClause.translations = {
        some: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          translations: true,
          media: true,
          category: {
            include: {
              translations: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: POSTS_PER_PAGE,
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    // Format posts with proper translations
    const formattedPosts = posts
      .map(post => {
        const postTranslation = post.translations.find(t => t.locale === locale) || post.translations[0];
        if (!postTranslation) return null;

        const categoryTranslation = post.category?.translations?.find(t => t.locale === locale) || 
                                  post.category?.translations?.[0];

        const featuredImage = post.media.find(pm => pm.media.type === MediaType.IMAGE)?.media?.url || '/images/default-post-image.svg';

        return {
          id: post.id,
          slug: postTranslation.slug,
          title: postTranslation.title,
          summary: postTranslation.summary || '',
          publishedAt: post.publishedAt || post.createdAt,
          imageUrl: featuredImage,
          category: categoryTranslation ? {
            name: categoryTranslation.name,
            slug: categoryTranslation.slug,
          } : null,
        };
      })
      .filter(Boolean);

    return {
      posts: formattedPosts,
      total,
      totalPages: Math.ceil(total / POSTS_PER_PAGE),
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return {
      posts: [],
      total: 0,
      totalPages: 0,
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'All News | Ektisadi Press',
    description: 'Browse all the latest news and articles from Ektisadi Press.',
    openGraph: {
      title: 'All News | Ektisadi Press',
      description: 'Browse all the latest news and articles from Ektisadi Press.',
      type: 'website',
    },
  };
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function NewsPage(props: PageProps) {
  try {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    const isRTL = locale === 'ar';
    
    const searchParams = await props.searchParams;
    const currentPage = parseInt(searchParams.page || '1', 10);
    const searchQuery = searchParams.search || '';
    
    const { posts, total, totalPages } = await fetchPosts(currentPage, searchQuery, locale);
    
    // Generate pagination URLs
    const generatePageUrl = (page: number) => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (searchQuery) params.set('search', searchQuery);
      return `/news?${params.toString()}`;
    };

    return (
      <MainLayout>
        <div className={`container mx-auto py-8 px-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold mb-4">
                {isRTL ? 'جميع الأخبار' : 'All News'}
              </h1>
            </div>

            {/* Search Form */}
            <div className="mb-8">
              <form method="GET" className="max-w-md mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchQuery}
                    placeholder={isRTL ? '     البحث في الأخبار...' : 'Search news...'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
            
            {/* Posts Grid */}
            {posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  {posts.map((post: any) => (
                    <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <Link href={`/posts/${encodeURIComponent(post.slug)}`}>
                        <div className="relative h-48 w-full">
                          <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      </Link>
                      <div className="p-6">
                        {post.category && (
                          <Link 
                            href={`/categories/${encodeURIComponent(post.category.slug)}`}
                            className="inline-block px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-md mb-2 hover:bg-primary-200 transition-colors"
                          >
                            {post.category.name}
                          </Link>
                        )}
                        <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="block">
                          <h2 className="text-xl font-semibold mb-2 hover:text-primary-600 transition-colors line-clamp-2">
                            {post.title}
                          </h2>
                        </Link>
                        <p className="text-gray-500 text-sm mb-3">
                          {formatDateLocalized(post.publishedAt.toISOString(), locale)}
                        </p>
                        {post.summary && (
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {post.summary}
                          </p>
                        )}
                        <Link 
                          href={`/posts/${encodeURIComponent(post.slug)}`}
                          className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                        >
                          {isRTL ? 'اقرأ المزيد →' : 'Read More →'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    {/* Previous Button */}
                    {currentPage > 1 && (
                      <Link
                        href={generatePageUrl(currentPage - 1)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        {isRTL ? 'السابق' : 'Previous'}
                      </Link>
                    )}

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, currentPage - 2) + i;
                      if (page > totalPages) return null;
                      
                      return (
                        <Link
                          key={page}
                          href={generatePageUrl(page)}
                          className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                            page === currentPage
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </Link>
                      );
                    })}

                    {/* Next Button */}
                    {currentPage < totalPages && (
                      <Link
                        href={generatePageUrl(currentPage + 1)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        {isRTL ? 'التالي' : 'Next'}
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold text-gray-600 mb-4">
                  {isRTL ? 'لا توجد منشورات' : 'No Posts Found'}
                </h2>
                <p className="text-gray-500 mb-8">
                  {searchQuery 
                    ? (isRTL ? `لم يتم العثور على نتائج لـ "${searchQuery}"` : `No results found for "${searchQuery}"`)
                    : (isRTL ? 'لم يتم العثور على منشورات بعد.' : 'No posts have been published yet.')
                  }
                </p>
                <Link 
                  href="/"
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                >
                  {isRTL ? 'العودة إلى الصفحة الرئيسية' : 'Return to Home Page'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    );
  } catch (error) {
    console.error('Error rendering news page:', error);
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading News</h1>
            <p className="text-gray-600 mb-8">Sorry, we couldn't load the news at this time.</p>
            <Link href="/" className="text-primary-600 hover:underline">
              Return to Home Page
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }
} 