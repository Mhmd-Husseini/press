import React from 'react';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Post, PostTranslation, Category, CategoryTranslation, Tag, Media, MediaType, PostStatus } from '@prisma/client';
import MainLayout from '@/components/layouts/MainLayout';
import { formatDateLocalized } from '@/lib/utils';
import prisma from '@/lib/prisma';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <div className="error-boundary">
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-red-800 font-semibold">Something went wrong</h2>
        <p className="text-red-600">We couldn't load this post. Please try again later.</p>
      </div>
      {children}
    </div>
  );
}

// Not found component for better UX
function PostNotFound({ locale = 'en' }: { locale?: string }) {
  const isRTL = locale === 'ar';
  return (
    <MainLayout>
      <div className={`container mx-auto py-16 px-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">
            {isRTL ? 'المنشور غير موجود' : 'Post Not Found'}
          </h1>
          <p className="text-lg mb-8">
            {isRTL 
              ? 'عذراً، لا يمكننا العثور على المنشور الذي تبحث عنه.'
              : 'Sorry, we couldn\'t find the post you\'re looking for.'
            }
          </p>
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
          >
            {isRTL ? 'العودة إلى الصفحة الرئيسية' : 'Return to Home Page'}
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

// Safely fetch post without directly accessing params.slug
async function fetchPost(slug: string) {
  try {
    // Get the current locale from cookies
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    
    console.log(`Attempting to fetch post with slug: "${slug}" for locale: "${locale}"`);
    
    // Try to decode the slug if it's URL encoded
    const decodedSlug = decodeURIComponent(slug);
    console.log(`Original slug: "${slug}"`);
    console.log(`Decoded slug: "${decodedSlug}"`);
    
    // Log the total count of posts for debugging
    const totalPosts = await prisma.post.count({
      where: {
        status: PostStatus.PUBLISHED,
      }
    });
    console.log(`Total published posts in database: ${totalPosts}`);
    
    // Get all posts with translations to check what exists
    const allPostsWithTranslations = await prisma.postTranslation.findMany({
      take: 5, // Limit to first 5 for debugging
      select: {
        id: true,
        locale: true,
        slug: true, 
        title: true,
        postId: true
      }
    });
    
    console.log("Available posts (first 5):", JSON.stringify(allPostsWithTranslations, null, 2));
    
    // Try first with exact match
    let post = await prisma.post.findFirst({
      where: {
        translations: {
          some: {
            slug: slug,
          },
        },
        status: PostStatus.PUBLISHED,
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        media: true,
      },
    });
    
    // If not found, try with decoded slug
    if (!post && slug !== decodedSlug) {
      console.log(`No post found with original slug, trying decoded slug: "${decodedSlug}"`);
      post = await prisma.post.findFirst({
        where: {
          translations: {
            some: {
              slug: decodedSlug,
            },
          },
          status: PostStatus.PUBLISHED,
        },
        include: {
          translations: true,
          category: {
            include: {
              translations: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          media: true,
        },
      });
    }

    // If still not found, try by ID if the slug looks like an ID
    if (!post && !isNaN(Number(slug))) {
      console.log(`Trying to find post by ID: ${slug}`);
      post = await prisma.post.findFirst({
        where: {
          id: slug, // Use string ID as is, no parsing needed
          status: PostStatus.PUBLISHED,
        },
        include: {
          translations: true,
          category: {
            include: {
              translations: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          media: true,
        },
      });
    }

    if (!post) {
      console.log(`No post found with slug: "${slug}" or decoded slug: "${decodedSlug}"`);
      return null;
    }

    console.log(`Post found with ID: ${post.id}, title: "${post.translations[0]?.title || 'No title'}"`);

    // Get translation for the current locale or any available locale
    const postTranslation = post.translations.find((t: PostTranslation) => t.locale === locale) || 
                           post.translations[0];

    // Get category translation for the current locale or any available locale
    const categoryTranslation = post.category.translations.find((t: CategoryTranslation) => t.locale === locale) || 
                               post.category.translations[0];

    return { post, postTranslation, categoryTranslation };
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export default async function PostPage(props: PageProps) {
  try {
    // First, await cookies to get the locale before accessing props.params.slug
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    const isRTL = locale === 'ar';
    
    // IMPORTANT: In Next.js 15, await the params object before accessing its properties
    const params = await props.params;
    const slug = params.slug;
    
    console.log(`Processing request for post with slug: "${slug}"`);
    
    // Fetch post data
    const result = await fetchPost(slug);
    
    if (!result) {
      console.log(`Returning 404 for slug: "${slug}"`);
      return <PostNotFound locale={locale} />;
    }
    
    const { post, postTranslation, categoryTranslation } = result;
    
    // Get featured image if available
    const featuredImage = post.media.find((m: Media) => m.type === MediaType.IMAGE);
    const imageUrl = featuredImage ? featuredImage.url : '/images/default-post-image.svg';
    
    // Extract author name if available
    const authorName = post.authorName || 'Phoenix Staff';
    
    return (
      <MainLayout>
        <div className={`container mx-auto py-8 px-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="max-w-4xl mx-auto">
            {/* Category Link */}
            <Link 
              href={`/categories/${categoryTranslation.slug}`}
              className="inline-block px-3 py-1 bg-primary-600 text-white rounded-md mb-4 hover:bg-primary-700 transition"
            >
              {categoryTranslation.name}
            </Link>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{postTranslation.title}</h1>
            
            {/* Meta information */}
            <div className="flex items-center text-gray-600 mb-6 gap-4">
              <span>{authorName}</span>
              <span>•</span>
              <span>{formatDateLocalized(
                (post.publishedAt || post.createdAt).toISOString(), 
                locale
              )}</span>
            </div>
            
            {/* Featured Image */}
            <div className="relative w-full h-[400px] mb-8 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={postTranslation.title}
                fill
                className="object-fill w-full h-full"
                priority
                sizes="(max-width: 768px) 100vw, 1024px"
                quality={90}
              />
            </div>
            
            {/* Content */}
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: postTranslation.content }}
            />
            
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">{isRTL ? 'وسوم:' : 'Tags:'}</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(({ tag }: { tag: Tag }) => (
                    <Link 
                      key={tag.id}
                      href={`/tags/${tag.id}`}
                      className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    );
  } catch (error) {
    console.error("Error rendering post page:", error);
    return (
      <MainLayout>
        <ErrorBoundary>
          <div className="container mx-auto py-8 px-4">
            <Link href="/" className="text-primary-600 hover:underline">
              ← Return to Home
            </Link>
          </div>
        </ErrorBoundary>
      </MainLayout>
    );
  }
} 