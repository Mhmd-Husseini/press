import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import MainLayout from '@/components/layouts/MainLayout';
import prisma from '@/lib/prisma';
import { formatDateLocalized } from '@/lib/utils';
import { MediaType } from '@prisma/client';
import { PostStatus } from '@prisma/client';
import InfiniteScrollPosts from '@/components/categories/InfiniteScrollPosts';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

const POSTS_PER_PAGE = 12;

// Fetch category and its posts
async function fetchCategoryPosts(slug: string, locale: string, page: number = 1) {
  try {
    console.log(`Fetching category with slug: ${slug} for locale: ${locale}, page: ${page}`);
    
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
      console.log(`No category found with slug: ${decodedSlug}`);
      return null;
    }

    console.log(`Found category: ${categoryTranslation.name} (ID: ${categoryTranslation.categoryId})`);

    // Get all translations for the category for proper localization
    const allCategoryTranslations = await prisma.categoryTranslation.findMany({
      where: {
        categoryId: categoryTranslation.categoryId,
      },
    });

    const skip = (page - 1) * POSTS_PER_PAGE;

    // Find posts in this category with proper ordering and pagination
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          categoryId: categoryTranslation.categoryId,
          deletedAt: null, // Only active posts
          status: PostStatus.PUBLISHED, // Add status filter for published posts only
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
          createdAt: 'desc', // Order by creation date instead of publish date
        },
        skip,
        take: POSTS_PER_PAGE,
      }),
      prisma.post.count({
        where: {
          categoryId: categoryTranslation.categoryId,
          deletedAt: null,
          status: PostStatus.PUBLISHED,
        },
      }),
    ]);

    console.log(`Found ${posts.length} posts for this category (total: ${total})`);

    // Format posts with the right translations for the current locale and sort by date
    const formattedPosts = posts
      .map(post => {
        const postTranslation = post.translations.find(t => t.locale === locale) || post.translations[0];
        if (!postTranslation) return null;

        // Find featured image
        const featuredImage = post.media.find(pm => pm.media.type === MediaType.IMAGE)?.media?.url || '/images/default-post-image.svg';

        return {
          id: post.id,
          slug: postTranslation.slug,
          title: postTranslation.title,
          excerpt: postTranslation.summary || '',
          publishedAt: post.publishedAt || post.createdAt,
          imageUrl: featuredImage,
        };
      })
      .filter(Boolean)
      // Double check sort to ensure newest first
      .sort((a: any, b: any) => {
        const dateA = new Date(a.publishedAt);
        const dateB = new Date(b.publishedAt);
        return dateB.getTime() - dateA.getTime();
      });

    return {
      category: {
        id: categoryTranslation.categoryId,
        name: categoryTranslation.name,
        description: categoryTranslation.description,
        translations: allCategoryTranslations,
      },
      posts: formattedPosts,
      total,
      totalPages: Math.ceil(total / POSTS_PER_PAGE),
    };
  } catch (error) {
    console.error('Error fetching category posts:', error);
    return null;
  }
}

// Generate metadata for the category page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const slug = params.slug;
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    
    // Find category translation by slug
    const categoryTranslation = await prisma.categoryTranslation.findUnique({
      where: {
        slug: slug,
      },
    });

    if (!categoryTranslation) {
      return {
        title: 'Category Not Found',
        description: 'The requested category could not be found.',
      };
    }

    return {
      title: `${categoryTranslation.name} | Ektisadi.com`,
      description: categoryTranslation.description || `Browse all articles in the ${categoryTranslation.name} category.`,
      openGraph: {
        title: `${categoryTranslation.name} | Ektisadi.com`,
        description: categoryTranslation.description || `Browse all articles in the ${categoryTranslation.name} category.`,
        type: 'website',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Ektisadi.com | Category',
      description: 'Browse articles by category',
    };
  }
}

export default async function CategoryPage(props: PageProps) {
  try {
    // Get cookies first (Next.js 15 requirement)
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    const isRTL = locale === 'ar';
    
    // IMPORTANT: In Next.js 15, await the params object before accessing its properties
    const params = await props.params;
    const searchParams = await props.searchParams;
    const slug = params.slug;
    const currentPage = parseInt(searchParams.page || '1', 10);
    
    console.log(`Processing request for category: ${slug}, page: ${currentPage}`);
    
    // Fetch category and posts
    const result = await fetchCategoryPosts(slug, locale, currentPage);
    
    if (!result) {
      return notFound();
    }
    
    const { category, posts, total, totalPages } = result;

    // Generate pagination URLs
    const generatePageUrl = (page: number) => {
      return `/categories/${encodeURIComponent(slug)}?page=${page}`;
    };
    
    return (
      <MainLayout>
        <div className={`container mx-auto py-8 px-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="max-w-7xl mx-auto">
            {/* Category Header */}
            <div className="mb-12 text-center">
              <h1 className="text-2xl font-bold">{category.name}</h1>
              {category.description && (
                <p className="text-base text-gray-600 max-w-3xl mx-auto mb-4">
                  {category.description}
                </p>
              )}
            </div>
            
            {/* Infinite Scroll Posts */}
            <InfiniteScrollPosts
              initialPosts={posts.map((post: any) => ({
                id: post.id,
                slug: post.slug,
                title: post.title,
                excerpt: post.excerpt,
                imageUrl: post.imageUrl,
                publishedAt: (post.publishedAt || post.createdAt).toISOString(),
                createdAt: (post.publishedAt || post.createdAt).toISOString(), // Use publishedAt as createdAt for consistency
              }))}
              initialPagination={{
                page: currentPage,
                limit: POSTS_PER_PAGE,
                total,
                totalPages,
                hasMore: currentPage < totalPages,
              }}
              categorySlug={slug}
              locale={locale}
              isRTL={isRTL}
            />
          </div>
        </div>
      </MainLayout>
    );
  } catch (error) {
    console.error('Error rendering category page:', error);
    return notFound();
  }
}