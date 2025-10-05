import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PostStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const locale = searchParams.get('locale') || 'en';
    
    const skip = (page - 1) * limit;
    
    // Decode the URL slug to properly handle Arabic and special characters
    const decodedSlug = decodeURIComponent(slug);
    
    // Find category translation by slug
    const categoryTranslation = await prisma.categoryTranslation.findUnique({
      where: {
        slug: decodedSlug,
      },
      include: {
        category: true,
      },
    });

    if (!categoryTranslation) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Find posts in this category with proper ordering and pagination
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          categoryId: categoryTranslation.categoryId,
          deletedAt: null,
          status: PostStatus.PUBLISHED,
        },
        include: {
          translations: true,
          media: {
            include: {
              media: true
            }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: {
          categoryId: categoryTranslation.categoryId,
          deletedAt: null,
          status: PostStatus.PUBLISHED,
        },
      }),
    ]);

    // Format posts with proper translations
    const formattedPosts = posts.map((post: any) => {
      const postTranslation = post.translations.find((t: any) => t.locale === locale) || 
                            post.translations[0];
      
      if (!postTranslation) {
        return null;
      }

      // Get featured image
      const featuredImage = post.media.find((pm: any) => pm.media.type === 'IMAGE')?.media;
      const imageUrl = featuredImage ? featuredImage.url : '/images/default-post-image.svg';

      return {
        id: post.id,
        slug: postTranslation.slug,
        title: postTranslation.title,
        excerpt: postTranslation.summary || postTranslation.content?.substring(0, 150) + '...',
        imageUrl,
        publishedAt: post.createdAt,
        createdAt: post.createdAt,
      };
    }).filter(Boolean);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });

  } catch (error) {
    console.error('Error fetching category posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
