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
          publishedAt: 'desc', // Ensure newest posts appear first
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
              <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
              {category.description && (
                <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
                  {category.description}
                </p>
              )}
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
                        <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="block">
                          <h2 className="text-xl font-semibold mb-2 hover:text-primary-600 transition-colors line-clamp-2">
                            {post.title}
                          </h2>
                        </Link>
                        <p className="text-gray-500 text-sm mb-3">
                          {formatDateLocalized(post.publishedAt.toISOString(), locale)}
                        </p>
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
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
                  {isRTL 
                    ? 'لم يتم العثور على منشورات في هذه الفئة بعد.' 
                    : 'No posts have been found in this category yet.'}
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
    console.error('Error rendering category page:', error);
    return notFound();
  }
}