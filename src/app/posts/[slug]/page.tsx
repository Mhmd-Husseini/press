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
import HtmlFixer from '@/components/shared/HtmlFixer';

// Robust function to process post content - only removes script tags and fixes Twitter embeds
function processPostContent(content: string): string {
  let processedContent = content;
  
  
  // Step 1: Remove complex script tag patterns (wrapped in styled spans and links)
  // This handles patterns like: &lt;script async src="<a href="..."><span>...</span></a><span>..." charset="utf-8"&gt;&lt;/script&gt;</span>
  
  // Handle the exact pattern from the HTML output with escaped quotes (&quot;)
  // Pattern: &lt;script async src="<a target="_blank" rel="noopener noreferrer" href="https://platform.twitter.com/widgets.js"><span style="...">https://platform.twitter.com/widgets.js</span></a><span style="...">" charset="utf-8"&gt;&lt;/script&gt;</span>
  processedContent = processedContent.replace(
    /&lt;script async src="<a target="_blank" rel="noopener noreferrer" href="https:\/\/platform\.twitter\.com\/widgets\.js"><span[^>]*>https:\/\/platform\.twitter\.com\/widgets\.js<\/span><\/a><span[^>]*>" charset="utf-8"&gt;&lt;\/script&gt;<\/span>/gi,
    ''
  );
  
  // Handle the exact pattern with escaped quotes (&quot;)
  processedContent = processedContent.replace(
    /&lt;script async src="<a target="_blank" rel="noopener noreferrer" href="https:\/\/platform\.twitter\.com\/widgets\.js"><span[^>]*>https:\/\/platform\.twitter\.com\/widgets\.js<\/span><\/a><span[^>]*>&quot; charset=&quot;utf-8&quot;&gt;&lt;\/script&gt;<\/span>/gi,
    ''
  );
  
  // Handle variations of the pattern with different attributes and escaped quotes
  processedContent = processedContent.replace(
    /&lt;script async src="<a[^>]*href="https:\/\/platform\.twitter\.com\/widgets\.js"[^>]*>[\s\S]*?<\/a><span[^>]*>&quot; charset=&quot;utf-8&quot;&gt;&lt;\/script&gt;<\/span>/gi,
    ''
  );
  
  // Handle patterns without the closing &lt;/script&gt; tag
  processedContent = processedContent.replace(
    /&lt;script async src="<a[^>]*href="https:\/\/platform\.twitter\.com\/widgets\.js"[^>]*>[\s\S]*?<\/a><span[^>]*>&quot; charset=&quot;utf-8&quot;&gt;<\/span>/gi,
    ''
  );
  
  // Handle double-encoded patterns (Unicode escaped)
  // Pattern: \u0026lt;script async src="\u003c/span\u003e\u003ca target="_blank" rel="noopener noreferrer" href="https://platform.twitter.com/widgets.js"\u003e\u003cspan style="..."\u003ehttps://platform.twitter.com/widgets.js\u003c/span\u003e\u003c/a\u003e\u003cspan style="..."\u003e" charset="utf-8"\u0026gt;\u0026lt;/script\u0026gt;\u003c/span\u003e
  processedContent = processedContent.replace(
    /\\u0026lt;script async src="\\u003c\/span\\u003e\\u003ca target="_blank" rel="noopener noreferrer" href="https:\/\/platform\.twitter\.com\/widgets\.js"\\u003e\\u003cspan[^>]*\\u003ehttps:\/\/platform\.twitter\.com\/widgets\.js\\u003c\/span\\u003e\\u003c\/a\\u003e\\u003cspan[^>]*\\u003e" charset="utf-8"\\u0026gt;\\u0026lt;\/script\\u0026gt;\\u003c\/span\\u003e/gi,
    ''
  );
  
  // Handle more variations of double-encoded patterns
  processedContent = processedContent.replace(
    /\\u0026lt;script async src="\\u003c\/span\\u003e\\u003ca[^>]*href="https:\/\/platform\.twitter\.com\/widgets\.js"[^>]*\\u003e[\\s\\S]*?\\u003c\/a\\u003e\\u003cspan[^>]*\\u003e" charset="utf-8"\\u0026gt;\\u0026lt;\/script\\u0026gt;\\u003c\/span\\u003e/gi,
    ''
  );
  
  // Handle the actual pattern from HTML output (with proper escaping)
  // Pattern: &lt;script async src="</span><a target="_blank" rel="noopener noreferrer" href="https://platform.twitter.com/widgets.js"><span style="...">https://platform.twitter.com/widgets.js</span></a><span style="...">" charset="utf-8"&gt;&lt;/script&gt;</span>
  processedContent = processedContent.replace(
    /&lt;script async src="<\/span><a target="_blank" rel="noopener noreferrer" href="https:\/\/platform\.twitter\.com\/widgets\.js"><span[^>]*>https:\/\/platform\.twitter\.com\/widgets\.js<\/span><\/a><span[^>]*>" charset="utf-8"&gt;&lt;\/script&gt;<\/span>/gi,
    ''
  );
  
  // Handle variations of the actual pattern
  processedContent = processedContent.replace(
    /&lt;script async src="<\/span><a[^>]*href="https:\/\/platform\.twitter\.com\/widgets\.js"[^>]*>[\s\S]*?<\/a><span[^>]*>" charset="utf-8"&gt;&lt;\/script&gt;<\/span>/gi,
    ''
  );
  
  // Step 2: Remove Twitter widget scripts (both escaped and unescaped)
  processedContent = processedContent.replace(/&lt;script[^>]*src="https:\/\/platform\.twitter\.com\/widgets\.js"[^>]*&gt;[\s\S]*?&lt;\/script&gt;/gi, '');
  processedContent = processedContent.replace(/<script[^>]*src="https:\/\/platform\.twitter\.com\/widgets\.js"[^>]*><\/script>/gi, '');
  
  // Step 3: Remove Truth Social embed scripts (keep the iframe)
  processedContent = processedContent.replace(/<script[^>]*src="https:\/\/truthsocial\.com\/embed\.js"[^>]*><\/script>/gi, '');
  
  // Step 4: Remove any other script tags that might be present (but preserve iframes)
  processedContent = processedContent.replace(/&lt;script[^>]*&gt;[\s\S]*?&lt;\/script&gt;/gi, '');
  processedContent = processedContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Step 5: Handle escaped Twitter embeds (convert to clean blockquotes)
  // Only process if we find escaped content
  if (processedContent.includes('&lt;blockquote') && processedContent.includes('twitter-tweet')) {
    processedContent = processedContent.replace(
      /&lt;blockquote[^>]*class="twitter-tweet"[^>]*&gt;[\s\S]*?&lt;\/blockquote&gt;/gi,
      (match) => {
        // Extract Twitter URL from the escaped content
        const urlMatch = match.match(/https:\/\/twitter\.com\/[^\s"'>]+/);
        if (urlMatch) {
          const tweetUrl = urlMatch[0].replace(/[">\s]+$/, '').trim();
          return `<blockquote class="twitter-tweet"><p lang="en" dir="ltr"><a href="${tweetUrl}">View Tweet</a></p></blockquote>`;
        }
        return match;
      }
    );
  }
  
  // Step 6: Handle complex HTML-encoded Truth Social embeds (with styled spans and links)
  // Pattern: <span style="...">&lt;iframe src="</span><a href="...">...</a><span style="...">" class="truthsocial-embed" ...&gt;&lt;/iframe&gt;&lt;script src="</span><a href="...">...</a><span style="...">" async="async"&gt;&lt;/script&gt;</span>
  processedContent = processedContent.replace(
    /<span[^>]*style="[^"]*font-size:\s*small[^"]*"[^>]*>&lt;iframe src="<\/span><a[^>]*href="https:\/\/truthsocial\.com\/[^"]*"[^>]*>[\s\S]*?<\/a><span[^>]*style="[^"]*font-size:\s*small[^"]*"[^>]*>" class="truthsocial-embed"[^>]*&gt;&lt;\/iframe&gt;&lt;script src="<\/span><a[^>]*href="https:\/\/truthsocial\.com\/embed\.js"[^>]*>[\s\S]*?<\/a><span[^>]*style="[^"]*font-size:\s*small[^"]*"[^>]*>" async="async"&gt;&lt;\/script&gt;<\/span>/gi,
    (match) => {
      // Extract the Truth Social URL from the link
      const urlMatch = match.match(/href="(https:\/\/truthsocial\.com\/[^"]*)"/);
      if (urlMatch) {
        const truthUrl = urlMatch[1];
        return `<iframe src="${truthUrl}/embed" class="truthsocial-embed" style="max-width: 100%; border: 0" width="600" allowfullscreen="allowfullscreen"></iframe>`;
      }
      return match;
    }
  );
  
  // Step 7: Handle complex HTML-encoded Facebook embeds (with styled spans and links)
  // Pattern: &lt;iframe src="<a href="...">...</a>" width="500" height="709" ...&gt;&lt;/iframe&gt;
  processedContent = processedContent.replace(
    /&lt;iframe src="<a[^>]*href="https:\/\/www\.facebook\.com\/plugins\/[^"]*"[^>]*>[\s\S]*?<\/a>"[^>]*width="500"[^>]*height="709"[^>]*&gt;&lt;\/iframe&gt;/gi,
    (match) => {
      // Extract the Facebook URL from the link
      const urlMatch = match.match(/href="(https:\/\/www\.facebook\.com\/plugins\/[^"]*)"/);
      if (urlMatch) {
        const fbUrl = urlMatch[1];
        return `<iframe src="${fbUrl}" width="500" height="709" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
      }
      return match;
    }
  );

  // Step 7.5: Handle complex HTML-encoded Facebook embeds wrapped in styled spans
  // Pattern: <span style="...">&lt;iframe src="</span><a href="...">...</a><span style="...">" width="500" height="250" ...&gt;&lt;/iframe&gt;</span>
  processedContent = processedContent.replace(
    /<span[^>]*style="[^"]*font-size:\s*small[^"]*"[^>]*>&lt;iframe src="<\/span><a[^>]*href="https:\/\/www\.facebook\.com\/plugins\/[^"]*"[^>]*>[\s\S]*?<\/a><span[^>]*style="[^"]*font-size:\s*small[^"]*"[^>]*>"[^>]*width="500"[^>]*height="[^"]*"[^>]*&gt;&lt;\/iframe&gt;<\/span>/gi,
    (match) => {
      // Extract the Facebook URL from the link
      const urlMatch = match.match(/href="(https:\/\/www\.facebook\.com\/plugins\/[^"]*)"/);
      if (urlMatch) {
        const fbUrl = urlMatch[1];
        return `<iframe src="${fbUrl}" width="500" height="709" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
      }
      return match;
    }
  );

  // Step 7.6: Handle Facebook video embeds with different dimensions
  // Pattern: <span style="...">&lt;iframe src="</span><a href="...">...</a><span style="...">" width="267" height="591" ...&gt;&lt;/iframe&gt;</span>
  processedContent = processedContent.replace(
    /<span[^>]*style="[^"]*font-size:\s*small[^"]*"[^>]*>&lt;iframe src="<\/span><a[^>]*href="https:\/\/www\.facebook\.com\/plugins\/[^"]*"[^>]*>[\s\S]*?<\/a><span[^>]*style="[^"]*font-size:\s*small[^"]*"[^>]*>"[^>]*width="267"[^>]*height="[^"]*"[^>]*&gt;&lt;\/iframe&gt;<\/span>/gi,
    (match) => {
      // Extract the Facebook URL from the link
      const urlMatch = match.match(/href="(https:\/\/www\.facebook\.com\/plugins\/[^"]*)"/);
      if (urlMatch) {
        const fbUrl = urlMatch[1];
        return `<iframe src="${fbUrl}" width="267" height="591" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
      }
      return match;
    }
  );
  
  // Step 8: Handle simple HTML-encoded Truth Social embeds
  if (processedContent.includes('&lt;iframe src="https://truthsocial.com/')) {
    processedContent = processedContent.replace(
      /&lt;iframe src="https:\/\/truthsocial\.com\/[^"]*" class="truthsocial-embed"[^>]*&gt;&lt;\/iframe&gt;/gi,
      (match) => {
        // Decode the HTML entities
        const decoded = match
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&');
        
        // Ensure the iframe has proper attributes
        if (!decoded.includes('width=')) {
          return decoded.replace('>', ' width="600">');
        }
        return decoded;
      }
    );
  }
  
  // Step 9: Handle simple HTML-encoded Facebook embeds
  if (processedContent.includes('&lt;iframe src="https://www.facebook.com/plugins/')) {
    processedContent = processedContent.replace(
      /&lt;iframe src="https:\/\/www\.facebook\.com\/plugins\/[^"]*"[^>]*&gt;&lt;\/iframe&gt;/gi,
      (match) => {
        // Decode the HTML entities
        const decoded = match
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&');
        
        // Ensure the iframe has proper attributes
        if (!decoded.includes('width=')) {
          return decoded.replace('>', ' width="500">');
        }
        if (!decoded.includes('height=')) {
          return decoded.replace('>', ' height="709">');
        }
        return decoded;
      }
    );
  }
  
  // Step 10: Handle unencoded Truth Social embeds (ensure they're properly formatted)
  if (processedContent.includes('<iframe src="https://truthsocial.com/')) {
    processedContent = processedContent.replace(
      /<iframe src="https:\/\/truthsocial\.com\/[^"]*" class="truthsocial-embed"[^>]*><\/iframe>/gi,
      (match) => {
        // Ensure the iframe has proper attributes
        if (!match.includes('width=')) {
          return match.replace('>', ' width="600">');
        }
        return match;
      }
    );
  }
  
  // Step 11: Handle unencoded Facebook embeds (ensure they're properly formatted)
  if (processedContent.includes('<iframe src="https://www.facebook.com/plugins/')) {
    processedContent = processedContent.replace(
      /<iframe src="https:\/\/www\.facebook\.com\/plugins\/[^"]*"[^>]*><\/iframe>/gi,
      (match) => {
        // Ensure the iframe has proper attributes
        if (!match.includes('width=')) {
          return match.replace('>', ' width="500">');
        }
        if (!match.includes('height=')) {
          return match.replace('>', ' height="709">');
        }
        return match;
      }
    );
  }
  
  // Step 12: Handle styled spans containing Twitter content
  if (processedContent.includes('<span style="font-size: 12px') && processedContent.includes('&lt;blockquote')) {
    processedContent = processedContent.replace(
      /<span[^>]*style="[^"]*font-size:\s*12px[^"]*"[^>]*>[\s\S]*?&lt;blockquote[^>]*class="twitter-tweet"[^>]*&gt;[\s\S]*?&lt;\/blockquote&gt;[\s\S]*?<\/span>/gi,
      (match) => {
        const urlMatch = match.match(/https:\/\/twitter\.com\/[^\s"'>]+/);
        if (urlMatch) {
          const tweetUrl = urlMatch[0].replace(/[">\s]+$/, '').trim();
          return `<blockquote class="twitter-tweet"><p lang="en" dir="ltr"><a href="${tweetUrl}">View Tweet</a></p></blockquote>`;
        }
        return match;
      }
    );
  }
  
  // Step 13: Clean up malformed HTML entities only in Twitter embeds
  // Only decode entities within blockquotes to avoid corrupting other content
  processedContent = processedContent.replace(
    /<blockquote[^>]*class="twitter-tweet"[^>]*>[\s\S]*?<\/blockquote>/gi,
    (match) => {
      return match
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&mdash;/g, '—')
        .replace(/&mdash">/g, '&mdash;')
        .replace(/June">/g, 'June')
        .replace(/July">/g, 'July');
    }
  );
  
  // Step 14: Ensure Twitter embeds have proper structure
  processedContent = processedContent.replace(
    /<blockquote[^>]*class="twitter-tweet"[^>]*>[\s\S]*?<\/blockquote>/gi,
    (match) => {
      if (!match.includes('<p')) {
        return match.replace(
          /<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/,
          '<blockquote$1><p lang="en" dir="ltr">$2</p></blockquote>'
        );
      }
      return match;
    }
  );
  
  
  return processedContent;
}

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

// Add this function to fetch the post with proper slug handling
async function fetchPost(slug: string) {
  try {
    // Decode the URL slug to properly handle Arabic and special characters
    const decodedSlug = decodeURIComponent(slug);
    
    // Get the current locale from cookies
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    
    // Find post by slug through translations
    const post = await prisma.post.findFirst({
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
        postAuthor: true,
        media: true,
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

export default async function PostPage(props: PageProps) {
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
    const featuredImage = post.media.find((m: Media) => m.type === MediaType.IMAGE);
    const imageUrl = featuredImage ? featuredImage.url : '/images/default-post-image.svg';
    
    // Get all images for potential gallery display
    const allImages = post.media.filter((m: Media) => m.type === MediaType.IMAGE);
    
    // Get author information from postAuthor
    const author = (post as any).postAuthor;
    const authorName = author 
      ? (locale === 'ar' && author.nameAr ? author.nameAr : author.nameEn)
      : 'Phoenix Staff';
    const authorCountry = author?.country;
    const authorAvatar = author?.avatar;
    
    return (
      <MainLayout>
        <div className={`container mx-auto px-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="max-w-4xl mx-auto">
            {/* Category Link */}
            <Link 
              href={`/categories/${categoryTranslation.slug}`}
              className="inline-block px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
            >
              {categoryTranslation.name}
            </Link>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{postTranslation.title}</h1>
            
            {/* Author and Meta information */}
            <div className="flex items-center text-gray-600 mb-6 gap-4">
              <div className="flex items-center gap-3">
                {authorAvatar && (
                  <img 
                    src={authorAvatar} 
                    alt={authorName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">
                    {authorName}
                    {authorCountry && (
                      <span className="text-gray-700"> - {authorCountry}</span>
                    )}
                  </span>
                  <span className="text-sm text-gray-500">{formatDateLocalized((post.publishedAt || post.createdAt).toISOString(), locale)}</span>
                </div>
              </div>
            </div>
            
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
                <h3 className="text-2xl font-bold mb-6 text-gray-900">
                  {locale === 'ar' ? 'معرض الصور' : 'Image Gallery'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allImages.slice(1).map((image, index) => (
                    <div key={image.id} className="space-y-3">
                      <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
                        <Image
                          src={image.url}
                          alt={image.altText || `Image ${index + 2}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          quality={85}
                        />
                      </div>
                      {(image.caption || (image as any).captionAr) && (
                        <p className="text-sm text-gray-600 text-center italic" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                          {locale === 'ar' ? (image as any).captionAr : image.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Custom Styles for TiptapEditor Content */}
            <style dangerouslySetInnerHTML={{
              __html: `
                /* Basic Typography - No color restrictions */
                .max-w-none h1 {
                  font-size: 2.5rem;
                  font-weight: 700;
                  margin: 1rem 0 0.5rem 0;
                  line-height: 1.2;
                }
                
                .max-w-none h2 {
                  font-size: 2rem;
                  font-weight: 700;
                  margin: 1rem 0 0.5rem 0;
                  line-height: 1.2;
                }
                
                .max-w-none h3 {
                  font-size: 1.5rem;
                  font-weight: 700;
                  margin: 1rem 0 0.5rem 0;
                  line-height: 1.2;
                }
                
                /* Paragraph and Text Styles */
                .max-w-none p {
                  margin: 1rem 0;
                  line-height: 1.6;
                }
                
                .max-w-none span {
                  display: inline;
                }
                
                /* Highlight Styles */
                .max-w-none mark {
                  border-radius: 0.25rem;
                  padding: 0.125rem 0.25rem;
                }
                
                /* Table Styles */
                .max-w-none table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 1rem 0;
                }
                
                .max-w-none th,
                .max-w-none td {
                  border: 1px solid #d1d5db;
                  padding: 0.5rem;
                  text-align: left;
                }
                
                .max-w-none th {
                  background-color: #f9fafb;
                  font-weight: 600;
                }
                
                /* Image Styles */
                .max-w-none img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 0.5rem;
                  margin: 1rem 0;
                }
                
                /* Link Styles */
                .max-w-none a {
                  color: #3b82f6;
                  text-decoration: underline;
                }
                
                .max-w-none a:hover {
                  color: #1d4ed8;
                }
                
                /* Code Styles */
                .max-w-none code {
                  background-color: #f3f4f6;
                  padding: 0.125rem 0.25rem;
                  border-radius: 0.25rem;
                  font-family: 'Courier New', monospace;
                }
                
                .max-w-none pre {
                  background-color: #1f2937;
                  color: #f9fafb;
                  padding: 1rem;
                  border-radius: 0.5rem;
                  overflow-x: auto;
                }
                
                .max-w-none pre code {
                  background-color: transparent;
                  color: inherit;
                  padding: 0;
                }
                
                /* Blockquote Styles */
                .max-w-none blockquote {
                  border-left: 4px solid #3b82f6;
                  padding-left: 1rem;
                  margin: 1rem 0;
                  font-style: italic;
                  color: #6b7280;
                }
                
                /* List Styles - Force proper bullet and number display */
                .max-w-none ul {
                  list-style-type: disc !important;
                  padding-left: 2rem !important;
                  margin: 1rem 0 !important;
                }
                
                .max-w-none ol {
                  list-style-type: decimal !important;
                  padding-left: 2rem !important;
                  margin: 1rem 0 !important;
                }
                
                .max-w-none li {
                  margin: 0.5rem 0 !important;
                  display: list-item !important;
                  list-style-position: outside !important;
                }
                
                /* Nested list styles */
                .max-w-none ul ul {
                  list-style-type: circle !important;
                  padding-left: 2rem !important;
                }
                
                .max-w-none ul ul ul {
                  list-style-type: square !important;
                  padding-left: 2rem !important;
                }
                
                .max-w-none ol ol {
                  list-style-type: lower-alpha !important;
                  padding-left: 2rem !important;
                }
                
                .max-w-none ol ol ol {
                  list-style-type: lower-roman !important;
                  padding-left: 2rem !important;
                }
                
                /* RTL Support for Arabic */
                .max-w-none[dir="rtl"] {
                  text-align: right;
                }
                
                .max-w-none[dir="rtl"] h1,
                .max-w-none[dir="rtl"] h2,
                .max-w-none[dir="rtl"] h3 {
                  text-align: right;
                }
                
                .max-w-none[dir="rtl"] blockquote {
                  border-left: none;
                  border-right: 4px solid #3b82f6;
                  padding-left: 0;
                  padding-right: 1rem;
                }
                
                .max-w-none[dir="rtl"] ul,
                .max-w-none[dir="rtl"] ol {
                  padding-left: 0 !important;
                  padding-right: 2rem !important;
                }
                
                .max-w-none[dir="rtl"] li {
                  text-align: right;
                }
                
                /* Ensure inline styles work naturally without interference */
                
                /* Additional list styling to ensure bullets appear */
                .max-w-none ul li::marker {
                  color: currentColor !important;
                  font-weight: normal !important;
                }
                
                .max-w-none ol li::marker {
                  color: currentColor !important;
                  font-weight: normal !important;
                }
                
                /* Force list display even if CSS is reset */
                .max-w-none ul {
                  list-style: disc outside !important;
                }
                
                .max-w-none ol {
                  list-style: decimal outside !important;
                }
                
                /* Override any Tailwind prose list styles */
                .max-w-none ul,
                .max-w-none ol {
                  list-style-image: none !important;
                }
                
                /* Ensure list items are properly displayed */
                .max-w-none li {
                  list-style: inherit !important;
                }
                
                /* Remove any conflicting prose styles */
                .max-w-none .prose ul,
                .max-w-none .prose ol {
                  list-style: inherit !important;
                }
              `
            }} />
          </div>
        </div>
      </MainLayout>
    );
  } catch (error) {
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