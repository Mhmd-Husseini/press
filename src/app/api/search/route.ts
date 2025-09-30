import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get search parameters from URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const locale = searchParams.get('locale') || 'en';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    if (!query.trim()) {
      return NextResponse.json({ 
        results: [], 
        total: 0,
        page,
        limit
      });
    }

    console.log(`Searching for "${query}" in locale "${locale}"`);
    
    // Search for posts using the correct schema structure
    const searchResults = await prisma.post.findMany({
      where: {
        // Only search published or archived posts
        status: {
          in: ['PUBLISHED', 'ARCHIVED']
        },
        // Join with PostTranslation to search in title and content
        translations: {
          some: {
            locale: locale,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
              { summary: { contains: query, mode: 'insensitive' } }
            ]
          }
        }
      },
      // Include the related translation data and category
      include: {
        translations: {
          where: {
            locale: locale
          }
        },
        category: {
          include: {
            translations: {
              where: {
                locale: locale
              }
            }
          }
        },
        author: {
          select: {
            firstName: true,
            lastName: true,
            firstNameArabic: true,
            lastNameArabic: true
          }
        },
        postAuthor: true,
        media: {
          include: {
            media: true
          },
          take: 1
        }
      },
      orderBy: {
        publishedAt: { sort: 'desc', nulls: 'last' }
      },
      skip,
      take: limit,
    });
    
    // Count total matching posts
    const totalCount = await prisma.post.count({
      where: {
        status: {
          in: ['PUBLISHED', 'ARCHIVED']
        },
        translations: {
          some: {
            locale: locale,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
              { summary: { contains: query, mode: 'insensitive' } }
            ]
          }
        }
      }
    });
    
    console.log(`Found ${searchResults.length} matching posts out of ${totalCount} total matches`);
    
    // Format the results for the frontend
    const formattedResults = searchResults.map(post => {
      // Get the translation in the requested locale
      const translation = post.translations[0];
      
      // Safely extract an excerpt from content and strip HTML tags
      let excerpt = '';
      if (translation?.content) {
        // Remove HTML tags
        excerpt = translation.content
          .replace(/<[^>]*>/g, ' ') // Replace HTML tags with spaces
          .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
          .trim()
          .substring(0, 150);
        
        if (excerpt.length >= 150) {
          excerpt += '...';
        }
      } else if (translation?.summary) {
        excerpt = translation.summary.replace(/<[^>]*>/g, ' ').trim();
      }
      
      // Get image URL from media if available
      let imageUrl = '';
      if (post.media && post.media.length > 0) {
        const imageMedia = post.media.find(pm => pm.media?.type === 'IMAGE');
        if (imageMedia?.media?.url) {
          imageUrl = imageMedia.media.url;
        }
      }
      
      // Get category name
      let categoryName = '';
      if (post.category?.translations?.length > 0) {
        categoryName = post.category.translations[0].name;
      }
      
      // Format author name based on locale
      let authorName = '';
      if ((post as any).postAuthor) {
        const author = (post as any).postAuthor;
        if (locale === 'ar' && author.nameAr) {
          authorName = author.nameAr;
        } else {
          authorName = author.nameEn;
        }
      } else if (post.author) {
        if (locale === 'ar' && (post.author.firstNameArabic || post.author.lastNameArabic)) {
          authorName = `${post.author.firstNameArabic || ''} ${post.author.lastNameArabic || ''}`.trim();
        } else {
          authorName = `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim();
        }
      }
      
      if (!authorName) {
        authorName = 'Ektisadi Staff';
      }
      
      return {
        id: post.id,
        title: translation?.title || `Post ${post.id}`,
        slug: translation?.slug || post.id,
        excerpt,
        createdAt: post.createdAt.toISOString(),
        publishedAt: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
        authorName,
        category: categoryName ? {
          name: categoryName,
          slug: post.category.slug || ''
        } : undefined,
        imageUrl,
        status: post.status
      };
    });
    
    return NextResponse.json({
      results: formattedResults,
      total: totalCount,
      page,
      limit,
      query
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching' }, 
      { status: 500 }
    );
  }
} 