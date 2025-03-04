'use server';

import { Prisma, PostStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PostService, PostWithRelations } from '@/lib/services/post.service';

interface FetchPostsOptions {
  locale?: string;
  categoryId?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Fetch published posts for public display
 */
export async function fetchPublishedPosts({
  locale = 'en',
  categoryId,
  featured,
  page = 1,
  limit = 10,
  search
}: FetchPostsOptions = {}): Promise<{
  posts: PostWithRelations[];
  total: number;
  pages: number;
}> {
  const postService = new PostService(prisma);
  
  // Build where clause
  const where: Prisma.PostWhereInput = {
    status: PostStatus.PUBLISHED,
    deletedAt: null,
    ...(categoryId && { categoryId }),
    ...(featured !== undefined && { featured }),
    ...(search && {
      OR: [
        {
          translations: {
            some: {
              title: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          translations: {
            some: {
              content: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          translations: {
            some: {
              summary: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ]
    })
  };

  // Count total published posts matching the filters
  const total = await prisma.post.count({ where });
  const pages = Math.ceil(total / limit);

  // Get posts with pagination
  const posts = await prisma.post.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: [
      { featured: 'desc' },
      { publishedAt: 'desc' }
    ],
    include: {
      translations: locale ? { where: { locale } } : true,
      category: {
        include: {
          translations: locale ? { where: { locale } } : true
        }
      },
      author: true,
      media: true,
      tags: {
        include: {
          tag: true
        }
      }
    }
  });

  return {
    posts: posts as PostWithRelations[],
    total,
    pages
  };
}

/**
 * Fetch featured posts for the homepage
 */
export async function fetchFeaturedPosts(locale = 'en', limit = 5): Promise<PostWithRelations[]> {
  const { posts } = await fetchPublishedPosts({
    locale,
    featured: true,
    limit
  });
  
  return posts;
}

/**
 * Fetch posts by category for category pages
 */
export async function fetchPostsByCategory(
  categoryId: string,
  locale = 'en',
  page = 1,
  limit = 10
): Promise<{
  posts: PostWithRelations[];
  total: number;
  pages: number;
}> {
  return fetchPublishedPosts({
    locale,
    categoryId,
    page,
    limit
  });
}

/**
 * Fetch latest posts
 */
export async function fetchLatestPosts(locale = 'en', limit = 10): Promise<PostWithRelations[]> {
  const { posts } = await fetchPublishedPosts({
    locale,
    limit
  });
  
  return posts;
}

/**
 * Fetch a single post by slug
 */
export async function fetchPostBySlug(slug: string, locale = 'en'): Promise<PostWithRelations | null> {
  const postService = new PostService(prisma);
  
  const post = await prisma.post.findFirst({
    where: {
      translations: {
        some: {
          slug,
          locale
        }
      },
      status: PostStatus.PUBLISHED,
      deletedAt: null
    },
    include: {
      translations: true,
      category: {
        include: {
          translations: true
        }
      },
      author: true,
      media: true,
      tags: {
        include: {
          tag: true
        }
      }
    }
  });
  
  if (!post) return null;
  
  // Increment view count
  await postService.incrementViewCount(post.id);
  
  return post as PostWithRelations;
} 