'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDateLocalized } from '@/lib/utils';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  publishedAt: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface InfiniteScrollPostsProps {
  initialPosts: Post[];
  initialPagination: PaginationInfo;
  categorySlug: string;
  locale: string;
  isRTL: boolean;
}

export default function InfiniteScrollPosts({
  initialPosts,
  initialPagination,
  categorySlug,
  locale,
  isRTL
}: InfiniteScrollPostsProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialPagination.hasMore);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadMorePosts = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const nextPage = pagination.page + 1;
      const response = await fetch(
        `/api/categories/${encodeURIComponent(categorySlug)}/posts?page=${nextPage}&limit=${pagination.limit}&locale=${locale}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      
      setPosts(prevPosts => [...prevPosts, ...data.posts]);
      setPagination(data.pagination);
      setHasMore(data.pagination.hasMore);
    } catch (err) {
      console.error('Error loading more posts:', err);
      setError('Failed to load more posts');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, pagination.page, pagination.limit, categorySlug, locale]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMorePosts, hasMore, loading]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">
          {isRTL ? 'لا توجد مقالات في هذه الفئة' : 'No posts found in this category'}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {posts.map((post) => (
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
              <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="block">
                <h2 className="text-lg font-semibold hover:text-primary-600 transition-colors line-clamp-2 leading-snug mb-1">
                  {post.title}
                </h2>
              </Link>
              <p className="text-gray-500 text-xs mb-3">
                {formatDateLocalized(post.publishedAt, locale)}
              </p>
              <p className="text-gray-600 text-xs mb-2 line-clamp-3">
                {post.excerpt}
              </p>
              <Link 
                href={`/posts/${encodeURIComponent(post.slug)}`}
                className={`text-primary-600 hover:text-primary-700 font-medium transition-colors text-xs block ${isRTL ? 'text-left' : 'text-right'}`}
              >
                {isRTL ? 'اقرأ المزيد →' : 'Read More →'}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {loading ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-sm">
                {isRTL ? 'جاري التحميل...' : 'Loading more posts...'}
              </span>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              {isRTL ? 'مرر لأسفل لتحميل المزيد' : 'Scroll down to load more'}
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadMorePosts}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* End of Posts */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-sm">
            {isRTL ? 'تم عرض جميع المقالات' : 'You\'ve reached the end of posts'}
          </div>
        </div>
      )}
    </>
  );
}
