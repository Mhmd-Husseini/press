import React from 'react';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Post, PostTranslation, Category, CategoryTranslation, Tag, Media, MediaType, PostStatus } from '@prisma/client';
import MainLayout from '@/components/layouts/MainLayout';
import { formatDateLocalized, createSocialDescription } from '@/lib/utils';
import prisma from '@/lib/prisma';
import HtmlFixer from '@/components/shared/HtmlFixer';

// Robust function to process post content - only removes script tags and fixes Twitter embeds
function processPostContent(content: string): string {
  let processedContent = content;
  
  // Step 0: Convert new embed format to actual embeds
  // This handles embeds created with the new Embed extension
  processedContent = processedContent.replace(
    /<div[^>]*data-embed="true"[^>]*data-embed-src="([^"]*)"[^>]*data-embed-type="([^"]*)"[^>]*>[\s\S]*?<\/div>/g,
    (match, src, type) => {
      // Convert to proper embed format based on type
      if (type === 'twitter') {
        return `<blockquote class="twitter-tweet" data-lang="en"><a href="${src}"></a></blockquote>`;
      } else if (type === 'youtube') {
        const videoId = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (videoId) {
          return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        }
      }
      return match; // Return original if we can't process it
    }
  );

  // Step 1: Remove script tags completely
  processedContent = processedContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Step 2: Fix Twitter embeds - convert old format to new format
  processedContent = processedContent.replace(
    /<blockquote[^>]*class="twitter-tweet"[^>]*data-lang="([^"]*)"[^>]*><a[^>]*href="([^"]*)"[^>]*><\/a><\/blockquote>/g,
    (match, lang, url) => {
      return `<blockquote class="twitter-tweet" data-lang="${lang}"><a href="${url}"></a></blockquote>`;
    }
  );
  
  // Step 3: Fix any remaining Twitter embeds that might not have the data-lang attribute
  processedContent = processedContent.replace(
    /<blockquote[^>]*class="twitter-tweet"[^>]*><a[^>]*href="([^"]*)"[^>]*><\/a><\/blockquote>/g,
    (match, url) => {
      return `<blockquote class="twitter-tweet" data-lang="en"><a href="${url}"></a></blockquote>`;
    }
  );
  
  return processedContent;
}

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Generate metadata for social media sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    
    // Get the current locale from cookies
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    
    // Find post by slug (including unpublished posts for admin preview)
    const post = await prisma.post.findFirst({
      where: {
        translations: {
          some: {
            slug: decodedSlug,
          },
        },
        // Don't filter by status - allow unpublished posts for admin preview
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          },
        },
        postAuthor: true,
        media: {
          include: {
            media: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
      },
    });

    if (!post) {
      return {
        title: 'Post Not Found',
        description: 'The requested post could not be found.',
      };
    }
    
    // Get translation for the current locale
    const postTranslation = post.translations.find((t: PostTranslation) => t.locale === locale) || 
                          post.translations[0];
    
    // Get category translation
    const categoryTranslation = post.category?.translations?.find((t: CategoryTranslation) => t.locale === locale) || 
                              post.category?.translations?.[0];
    
    // Get featured image
    const featuredImage = post.media.find((pm: any) => pm.media.type === MediaType.IMAGE)?.media;
    const imageUrl = featuredImage ? featuredImage.url : '/images/default-post-image.svg';
    
    // Get author information
    const author = (post as any).postAuthor;
    const authorName = author ? `${author.firstName} ${author.lastName}`.trim() : 'Ektisadi.com';
    
    // Create optimized description for social media sharing
    const description = postTranslation.summary 
      ? createSocialDescription(postTranslation.summary, 160)
      : postTranslation.content 
        ? createSocialDescription(postTranslation.content, 160)
        : (locale === 'ar' 
          ? 'اقرأ آخر الأخبار والتحليلات من إقتصادي' 
          : 'Read the latest news and analysis from Ektisadi.com');
    
    // Create canonical URL for structured data
    const decodedSlugForUrl = decodeURIComponent(postTranslation.slug);
    const canonicalUrl = `https://ektisadi.com/posts/${decodedSlugForUrl}`;
    
    return {
      title: postTranslation.title,
      description,
      keywords: [
        categoryTranslation?.name || '',
        authorName,
        locale === 'ar' ? 'اقتصاد' : 'economy',
        locale === 'ar' ? 'أخبار' : 'news',
        locale === 'ar' ? 'تحليل' : 'analysis'
      ].filter(Boolean).join(', '),
      authors: [{ name: authorName }],
      openGraph: {
        title: postTranslation.title,
        description,
        url: canonicalUrl,
        siteName: 'Ektisadi.com',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: postTranslation.title,
          },
        ],
        locale: locale === 'ar' ? 'ar_SA' : 'en_US',
        type: 'article',
        publishedTime: post.publishedAt?.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: [authorName],
        section: categoryTranslation?.name,
        tags: post.tags?.map((pt: any) => pt.tag.name) || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: postTranslation.title,
        description,
        images: [imageUrl],
        creator: '@ektisadi',
        site: '@ektisadi',
      },
      alternates: {
        canonical: canonicalUrl,
        languages: {
          'ar': `https://ektisadi.com/posts/${decodedSlugForUrl}?locale=ar`,
          'en': `https://ektisadi.com/posts/${decodedSlugForUrl}?locale=en`,
        },
      },
      robots: {
        index: post.status === PostStatus.PUBLISHED,
        follow: post.status === PostStatus.PUBLISHED,
        googleBot: {
          index: post.status === PostStatus.PUBLISHED,
          follow: post.status === PostStatus.PUBLISHED,
        },
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    };
  }
}

function PostNotFound({ locale = 'en' }: { locale?: string }) {
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {locale === 'ar' ? 'المنشور غير موجود' : 'Post Not Found'}
          </h1>
          <p className="text-gray-600 mb-8">
            {locale === 'ar' 
              ? 'عذراً، لا يمكن العثور على المنشور المطلوب.' 
              : 'Sorry, the requested post could not be found.'}
          </p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {locale === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

// Add this function to fetch the post with proper slug handling
async function fetchPost(slug: string) {
  try {
    // Decode the URL slug to properly handle Arabic and special characters
    const decodedSlug = decodeURIComponent(slug);
    
    // Get the current locale from cookies
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    
    // Find post by slug through translations (including unpublished posts for admin preview)
    const post = await prisma.post.findFirst({
      where: {
        translations: {
          some: {
            slug: decodedSlug,
          },
        },
        // Don't filter by status - allow unpublished posts for admin preview
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          },
        },
        postAuthor: true,
        media: {
          include: {
            media: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
      },
    });

    if (!post) {
      return null;
    }
    
    // Get translation for the current locale or any available locale
    const postTranslation = post.translations.find((t: PostTranslation) => t.locale === locale) || 
                          post.translations[0];

    // Get category translation for the current locale or any available locale
    const categoryTranslation = post.category?.translations?.find((t: CategoryTranslation) => t.locale === locale) || 
                              post.category?.translations?.[0];
    
    return { post, postTranslation, categoryTranslation };
  } catch (error) {
    return null;
  }
}

export default async function AdminPostPreviewPage(props: PageProps) {
  try {
    // First, await cookies to get the locale before accessing props.params.slug
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    const isRTL = locale === 'ar';
    
    // IMPORTANT: In Next.js 15, await the params object before accessing its properties
    const params = await props.params;
    const slug = params.slug;
    
    // Fetch post data
    const result = await fetchPost(slug);
    
    if (!result) {
      return <PostNotFound locale={locale} />;
    }
    
    const { post, postTranslation, categoryTranslation } = result;
    
    // Get featured image if available
    const featuredImage = post.media.find((pm: any) => pm.media.type === MediaType.IMAGE)?.media;
    const imageUrl = featuredImage ? featuredImage.url : '/images/default-post-image.svg';
    
    // Get all images for potential gallery display
    const allImages = post.media.filter((pm: any) => pm.media.type === MediaType.IMAGE).map((pm: any) => pm.media);
    
    // Get author information from postAuthor
    const author = (post as any).postAuthor;
    const authorName = author 
      ? (locale === 'ar' && author.nameAr ? author.nameAr : author.nameEn)
      : 'Ektisadi Staff';
    const authorCountry = author?.country;
    const authorAvatar = author?.avatar;
    
    // Create optimized description for structured data (same as in generateMetadata)
    const description = postTranslation.summary 
      ? createSocialDescription(postTranslation.summary, 160)
      : postTranslation.content 
        ? createSocialDescription(postTranslation.content, 160)
        : (locale === 'ar' 
          ? 'اقرأ آخر الأخبار والتحليلات من إقتصادي' 
          : 'Read the latest news and analysis from Ektisadi.com');
    
    // Create canonical URL for structured data
    const decodedSlugForUrl = decodeURIComponent(postTranslation.slug);
    const canonicalUrl = `https://ektisadi.com/posts/${decodedSlugForUrl}`;
    
    // Get tags for the post
    const tags = post.tags?.map((pt: any) => pt.tag) || [];
    
    // Format dates
    const publishedDate = post.publishedAt ? formatDateLocalized(post.publishedAt.toISOString(), locale) : null;
    const updatedDate = formatDateLocalized(post.updatedAt.toISOString(), locale);
    
    // Create structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": postTranslation.title,
      "description": description,
      "image": imageUrl,
      "author": {
        "@type": "Person",
        "name": authorName,
        ...(authorCountry && { "address": { "@type": "PostalAddress", "addressCountry": authorCountry } })
      },
      "publisher": {
        "@type": "Organization",
        "name": "Ektisadi.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://ektisadi.com/phoenix-logo.svg"
        }
      },
      "datePublished": post.publishedAt?.toISOString(),
      "dateModified": post.updatedAt.toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "articleSection": categoryTranslation?.name,
      "keywords": tags.map((tag: Tag) => tag.name).join(', '),
      "inLanguage": locale === 'ar' ? 'ar-SA' : 'en-US'
    };

    return (
      <MainLayout>
        {/* Add admin preview banner */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Admin Preview:</strong> This is how the post will look when published. 
                Current status: <span className="font-semibold">{post.status}</span>
              </p>
              <div className="mt-2">
                <Link 
                  href={`/admin/posts/${post.id}/edit`}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  ← Back to Edit
                </Link>
              </div>
            </div>
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isRTL ? 'rtl' : 'ltr'}`}>
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-gray-700">
                  {locale === 'ar' ? 'الرئيسية' : 'Home'}
                </Link>
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href="/categories" className="hover:text-gray-700">
                  {locale === 'ar' ? 'الفئات' : 'Categories'}
                </Link>
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-900 font-medium">
                  {categoryTranslation?.name || 'Uncategorized'}
                </span>
              </li>
            </ol>
          </nav>

          {/* Article */}
          <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <header className="px-6 py-8 border-b border-gray-200">
              {/* Category */}
              {categoryTranslation && (
                <div className="mb-4">
                  <Link 
                    href={`/categories/${categoryTranslation.slug}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
                  >
                    {categoryTranslation.name}
                  </Link>
                </div>
              )}
              
              {/* Title */}
              <h1 className={`text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {postTranslation.title}
              </h1>
              
              {/* Summary */}
              {postTranslation.summary && (
                <p className={`text-lg text-gray-600 leading-relaxed mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {postTranslation.summary}
                </p>
              )}
              
              {/* Meta information */}
              <div className={`flex flex-wrap items-center gap-4 text-sm text-gray-500 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {/* Author */}
                <div className="flex items-center space-x-2">
                  {authorAvatar && (
                    <img 
                      src={authorAvatar} 
                      alt={authorName}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span>{authorName}</span>
                  {authorCountry && (
                    <span className="text-gray-400">• {authorCountry}</span>
                  )}
                </div>
                
                {/* Dates */}
                <div className="flex items-center space-x-4">
                  {publishedDate && (
                    <time dateTime={post.publishedAt?.toISOString()}>
                      {publishedDate}
                    </time>
                  )}
                  {updatedDate !== publishedDate && (
                    <time dateTime={post.updatedAt.toISOString()}>
                      {locale === 'ar' ? 'تم التحديث:' : 'Updated:'} {updatedDate}
                    </time>
                  )}
                </div>
                
                {/* Reading time */}
                {post.readingTime && (
                  <span>
                    {locale === 'ar' ? 'وقت القراءة:' : 'Reading time:'} {post.readingTime} {locale === 'ar' ? 'دقيقة' : 'min'}
                  </span>
                )}
              </div>
            </header>
            
            {/* Content */}
            <div className="px-6 py-8">
              {/* Featured Image */}
              <div className="mb-8">
                <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={featuredImage?.altText || postTranslation.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 1024px"
                    quality={90}
                  />
                </div>
                {/* Image Caption */}
                {(featuredImage?.caption || (featuredImage as any)?.captionAr) && (
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-600 italic" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                      {locale === 'ar' ? (featuredImage as any).captionAr : featuredImage?.caption}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div 
                className="max-w-none"
                dir={postTranslation.dir || 'ltr'}
                dangerouslySetInnerHTML={{ __html: processPostContent(postTranslation.content) }}
              />
              
              {/* HtmlFixer for Twitter embeds */}
              <HtmlFixer />
              
              {/* Additional Images Gallery */}
              {allImages.length > 1 && (
                <div className="mt-12">
                  <h3 className={`text-xl font-semibold text-gray-900 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {locale === 'ar' ? 'معرض الصور' : 'Image Gallery'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allImages.slice(1).map((image: any, index: number) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={image.url}
                          alt={image.altText || `Image ${index + 2}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {locale === 'ar' ? 'العلامات' : 'Tags'}
                  </h3>
                  <div className={`flex flex-wrap gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                    {tags.map((tag: Tag) => (
                      <span 
                        key={tag.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                      >
                        {locale === 'ar' && tag.nameArabic ? tag.nameArabic : tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </MainLayout>
    );
  } catch (error) {
    console.error('Error rendering admin post preview:', error);
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    return <PostNotFound locale={locale} />;
  }
}
