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
import ShareButtons from '@/components/shared/ShareButtons';

// Robust function to process post content - only removes script tags and fixes Twitter embeds
function processPostContent(content: string): string {
  let processedContent = content;
  
  // Step 0: Convert new embed format to actual embeds
  // This handles embeds created with the new Embed extension
  processedContent = processedContent.replace(
    /<div[^>]*data-embed="true"[^>]*data-embed-src="([^"]*)"[^>]*data-embed-type="([^"]*)"[^>]*>[\s\S]*?<\/div>/gi,
    (match, src, type) => {
      // Convert to actual embed based on type
      if (type === 'twitter') {
        // Check if it's a valid tweet URL (not a hashtag or other URL)
        const isTweetUrl = /\/(twitter|x)\.com\/[^\/]+\/status\/\d+/.test(src);
        if (isTweetUrl) {
          return `<blockquote class="twitter-tweet"><p lang="en" dir="ltr"><a href="${src}">View Tweet</a></p></blockquote>`;
        } else {
          // If it's not a tweet URL (e.g., hashtag), show a message
          return `<div style="padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center; color: #666;">
            <p>⚠️ Invalid Twitter embed URL. Please use a direct tweet URL like:</p>
            <p style="font-family: monospace; font-size: 12px; margin-top: 8px;">https://twitter.com/username/status/123456789</p>
          </div>`;
        }
      } else if (type === 'facebook') {
        const encodedUrl = encodeURIComponent(src);
        return `<iframe src="https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500" width="500" height="709" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
      } else if (type === 'youtube') {
        return `<iframe width="560" height="315" src="${src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      } else if (type === 'instagram') {
        return `<blockquote class="instagram-media" data-instgrm-permalink="${src}" data-instgrm-version="14"></blockquote>`;
      } else {
        // Generic iframe
        return `<iframe src="${src}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;
      }
    }
  );
  
  
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
  
  // Step 4: Remove <pre><code> wrappers around Twitter embeds
  // This fixes embeds that were inserted via the editor and got wrapped in code blocks
  processedContent = processedContent.replace(
    /<pre[^>]*><code[^>]*>(<blockquote[^>]*class="twitter-tweet"[^>]*>[\s\S]*?<\/blockquote>[\s\S]*?)<\/code><\/pre>/gi,
    '$1'
  );
  
  // Also handle escaped versions
  processedContent = processedContent.replace(
    /<pre[^>]*><code[^>]*>(&lt;blockquote[^>]*class="twitter-tweet"[^>]*&gt;[\s\S]*?&lt;\/blockquote&gt;[\s\S]*?)<\/code><\/pre>/gi,
    '$1'
  );
  
  // Step 5: Remove any other script tags that might be present (but preserve iframes)
  processedContent = processedContent.replace(/&lt;script[^>]*&gt;[\s\S]*?&lt;\/script&gt;/gi, '');
  processedContent = processedContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Step 5: Handle escaped Twitter embeds (convert to clean blockquotes)
  // This handles multiple patterns of escaped Twitter embeds
  if (processedContent.includes('&lt;blockquote') && processedContent.includes('twitter-tweet')) {
    // Pattern 1: Standard escaped blockquote
    processedContent = processedContent.replace(
      /&lt;blockquote[^>]*class="twitter-tweet"[^>]*&gt;[\s\S]*?&lt;\/blockquote&gt;/gi,
      (match) => {
        // Extract Twitter URL from the escaped content
        const urlMatch = match.match(/https:\/\/twitter\.com\/[^\s"'>&]+/);
        if (urlMatch) {
          const tweetUrl = urlMatch[0].replace(/[">\s&]+$/, '').trim();
          return `<blockquote class="twitter-tweet"><p lang="en" dir="ltr"><a href="${tweetUrl}">View Tweet</a></p></blockquote>`;
        }
        return match;
      }
    );
    
    // Pattern 2: Escaped blockquote with x.com URLs
    processedContent = processedContent.replace(
      /&lt;blockquote[^>]*class="twitter-tweet"[^>]*&gt;[\s\S]*?&lt;\/blockquote&gt;/gi,
      (match) => {
        // Extract x.com URL from the escaped content
        const urlMatch = match.match(/https:\/\/x\.com\/[^\s"'>&]+/);
        if (urlMatch) {
          const tweetUrl = urlMatch[0].replace(/[">\s&]+$/, '').trim();
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
  
  // Step 12: Handle styled spans containing Twitter content (comprehensive patterns)
  // First, handle the most complex pattern: spans with embedded links and escaped HTML
  // This pattern matches: <span>...&lt;blockquote...&gt;...</span><a href="...">...</a><span>...</span>... (repeated)
  if (processedContent.includes('&lt;blockquote') && processedContent.includes('twitter-tweet')) {
    // Pattern 0: Ultra-complex multi-span with links pattern (most aggressive)
    processedContent = processedContent.replace(
      /<p>(?:<span[^>]*>)?&lt;blockquote[^>]*class="twitter-tweet"[^>]*&gt;[\s\S]*?&lt;\/blockquote&gt;[\s\S]*?&lt;script[^>]*src="(?:<\/span>)?(?:<a[^>]*href=")?https:\/\/platform\.twitter\.com\/widgets\.js[\s\S]*?&lt;\/script&gt;(?:<\/span>)?<\/p>/gi,
      (match) => {
        // Extract all Twitter/X URLs from the match
        const urlMatches = match.match(/https:\/\/(twitter|x)\.com\/[^\/]+\/status\/\d+/g);
        if (urlMatches && urlMatches.length > 0) {
          const tweetUrl = urlMatches[0];
          return `<p><blockquote class="twitter-tweet"><p lang="en" dir="ltr"><a href="${tweetUrl}">View Tweet</a></p></blockquote></p>`;
        }
        return match;
      }
    );
    
    // Pattern 1: font-size: 12px with twitter.com
    processedContent = processedContent.replace(
      /<span[^>]*style="[^"]*font-size:\s*12px[^"]*"[^>]*>[\s\S]*?&lt;blockquote[^>]*class="twitter-tweet"[^>]*&gt;[\s\S]*?&lt;\/blockquote&gt;[\s\S]*?<\/span>/gi,
      (match) => {
        const urlMatch = match.match(/https:\/\/(twitter|x)\.com\/[^\s"'>&]+/);
        if (urlMatch) {
          const tweetUrl = urlMatch[0].replace(/[">\s&]+$/, '').trim();
          return `<blockquote class="twitter-tweet"><p lang="en" dir="ltr"><a href="${tweetUrl}">View Tweet</a></p></blockquote>`;
        }
        return match;
      }
    );
    
    // Pattern 2: font-size: small with twitter.com or x.com
    processedContent = processedContent.replace(
      /<span[^>]*style="[^"]*font-size:\s*small[^"]*"[^>]*>[\s\S]*?&lt;blockquote[^>]*class="twitter-tweet"[^>]*&gt;[\s\S]*?&lt;\/blockquote&gt;[\s\S]*?<\/span>/gi,
      (match) => {
        const urlMatch = match.match(/https:\/\/(twitter|x)\.com\/[^\s"'>&]+/);
        if (urlMatch) {
          const tweetUrl = urlMatch[0].replace(/[">\s&]+$/, '').trim();
          return `<blockquote class="twitter-tweet"><p lang="en" dir="ltr"><a href="${tweetUrl}">View Tweet</a></p></blockquote>`;
        }
        return match;
      }
    );
    
    // Pattern 3: Any span with escaped blockquote (catch-all)
    processedContent = processedContent.replace(
      /<span[^>]*>[\s\S]*?&lt;blockquote[^>]*class="twitter-tweet"[^>]*&gt;[\s\S]*?&lt;\/blockquote&gt;[\s\S]*?<\/span>/gi,
      (match) => {
        const urlMatch = match.match(/https:\/\/(twitter|x)\.com\/[^\s"'>&]+/);
        if (urlMatch) {
          const tweetUrl = urlMatch[0].replace(/[">\s&]+$/, '').trim();
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

// Generate metadata for social media sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    
    // Get the current locale from cookies
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ar';
    
    // Find post by slug
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
        media: {
          include: {
            media: true
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
    
    // Create canonical URL with decoded slug for better display in sharing
    // The browser will automatically encode it when needed, but it displays nicely in Arabic
    const decodedSlugForUrl = decodeURIComponent(postTranslation.slug);
    const canonicalUrl = `https://ektisadi.com/posts/${decodedSlugForUrl}`;
    
    // Also create an encoded version for programmatic sharing (WhatsApp API)
    const encodedCanonicalUrl = `https://ektisadi.com/posts/${encodeURIComponent(postTranslation.slug)}`;
    
    // Create optimized title for social media (max 60 characters for best display)
    const displayTitle = postTranslation.title.length > 60 
      ? postTranslation.title.substring(0, 57) + '...'
      : postTranslation.title;
    
    // Ensure image URL is absolute for social media sharing
    const absoluteImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `https://ektisadi.com${imageUrl}`;
    
    return {
      title: `${displayTitle} | Ektisadi.com`,
      description,
      keywords: [
        categoryTranslation?.name || 'News',
        'Lebanon',
        'Economy',
        'Business',
        'Politics',
        'Technology',
        'Ektisadi.com'
      ].join(', '),
      authors: [{ name: authorName }],
      creator: 'Ektisadi.com',
      publisher: 'Ektisadi.com',
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      openGraph: {
        type: 'article',
        title: postTranslation.title, // Use full title for Open Graph
        description,
        url: canonicalUrl,
        siteName: 'Ektisadi.com',
        locale: locale === 'ar' ? 'ar_LB' : 'en_US',
        images: [
          {
            url: absoluteImageUrl,
            width: 1200,
            height: 630,
            alt: postTranslation.title,
            type: 'image/jpeg',
            secureUrl: absoluteImageUrl, // Add secure URL for better compatibility
          },
        ],
        publishedTime: post.createdAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: [authorName],
        section: categoryTranslation?.name || 'News',
        tags: [categoryTranslation?.name || 'News', 'Lebanon', 'Economy'],
      },
      twitter: {
        card: 'summary_large_image',
        site: '@ektisadi',
        creator: '@ektisadi',
        title: postTranslation.title, // Use full title for Twitter
        description,
        images: [absoluteImageUrl],
      },
      alternates: {
        canonical: canonicalUrl,
        languages: {
          'ar-LB': `${canonicalUrl}?locale=ar`,
          'en-US': `${canonicalUrl}?locale=en`,
        },
      },
      other: {
        'article:author': authorName,
        'article:section': categoryTranslation?.name || 'News',
        'article:tag': categoryTranslation?.name || 'News',
        'og:locale:alternate': locale === 'ar' ? 'en_US' : 'ar_LB',
        'og:locale': locale === 'ar' ? 'ar_LB' : 'en_US',
        'twitter:app:country': 'LB',
        'twitter:app:name': 'Ektisadi.com',
        // Additional metadata for better WhatsApp sharing
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:type': 'image/jpeg',
        'og:image:secure_url': absoluteImageUrl,
        'og:site_name': 'Ektisadi.com',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Ektisadi.com - Latest News and Analysis',
      description: 'Read the latest news and analysis from Ektisadi.com',
    };
  }
}

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
      <div className={`container mx-auto py-4 px-8 lg:px-12 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
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
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ar';
    
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
        media: {
          include: {
            media: true
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

export default async function PostPage(props: PageProps) {
  try {
    // First, await cookies to get the locale before accessing props.params.slug
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ar';
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
    
    return (
      <MainLayout>
        {/* Structured Data for SEO and Social Media */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              "headline": postTranslation.title,
              "description": description,
              "image": imageUrl.startsWith('http') ? imageUrl : `https://ektisadi.com${imageUrl}`,
              "author": {
                "@type": "Person",
                "name": authorName,
                "url": `https://ektisadi.com/authors/${author?.id || 'ektisadi'}`
              },
              "publisher": {
                "@type": "Organization",
                "name": "Ektisadi.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://ektisadi.com/images/logo.png"
                },
                "url": "https://ektisadi.com"
              },
              "datePublished": post.createdAt.toISOString(),
              "dateModified": post.updatedAt.toISOString(),
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": canonicalUrl
              },
              "articleSection": categoryTranslation?.name || "News",
              "keywords": [
                categoryTranslation?.name || "News",
                "Lebanon",
                "Economy",
                "Business",
                "Politics",
                "Technology"
              ],
              "inLanguage": locale === 'ar' ? 'ar-LB' : 'en-US',
              "isAccessibleForFree": true,
              "copyrightYear": post.createdAt.getFullYear(),
              "copyrightHolder": {
                "@type": "Organization",
                "name": "Ektisadi.com"
              }
            })
          }}
        />
        <div className={`container mx-auto px-4 lg:px-12 py-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <div className="max-w-3xl mx-auto lg:mb-4 mb-3">
                {/* Category Link */}
                <Link 
                  href={`/categories/${categoryTranslation.slug}`}
                  className="inline-block px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                >
                  {categoryTranslation.name}
                </Link>
            
            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold mb-2">{postTranslation.title}</h1>
            
            {/* Author and Meta information */}
            <div className="flex items-center text-gray-600 mb-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                {authorAvatar && (
                  <img 
                    src={authorAvatar} 
                    alt={authorName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col">
                  <div className="font-medium text-gray-900">
                    {author ? (
                      <Link 
                        href={`/authors/${author.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {authorName}
                      </Link>
                    ) : (
                      <span>{authorName}</span>
                    )}
                    {authorCountry && (
                      <span className="text-gray-700"> - {authorCountry}</span>
                    )}
                  </div>
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

            {/* Sidebar with Share Buttons */}
            <div className="lg:col-span-4">
              <ShareButtons 
                title={postTranslation.title}
                url={canonicalUrl}
                locale={locale}
              />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  } catch (error) {
    return (
      <MainLayout>
        <ErrorBoundary>
          <div className="container mx-auto py-4 px-8 lg:px-12">
            <Link href="/" className="text-primary-600 hover:underline">
              ← Return to Home
            </Link>
          </div>
        </ErrorBoundary>
      </MainLayout>
    );
  }
} 