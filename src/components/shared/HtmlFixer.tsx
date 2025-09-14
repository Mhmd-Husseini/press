'use client';

import { useEffect } from 'react';

export default function HtmlFixer() {
  useEffect(() => {
    let isProcessing = false;
    
    const fixEscapedHtml = () => {
      if (isProcessing) return;
      
      isProcessing = true;
      
      const processedElements = new Set();
      
      // Find elements that contain escaped Twitter embeds
      const elements = document.querySelectorAll('div, span, p, article, section');
      
      elements.forEach(element => {
        if (processedElements.has(element) || element.hasAttribute('data-html-fixed')) {
          return;
        }
        
        const content = element.innerHTML;
        const textContent = element.textContent || '';
        
        // Check for escaped Twitter embeds
        const hasEscapedPattern = content.includes('&lt;blockquote class="twitter-tweet"&gt;') &&
                                 content.includes('&lt;p lang="zxx"') &&
                                 content.includes('&lt;a href="') &&
                                 content.includes('&lt;/blockquote&gt;');
        
        const hasDecodedPattern = content.includes('<blockquote class="twitter-tweet">');
        const hasRendered = element.querySelector('blockquote.twitter-tweet');
        const hasFallback = element.querySelector('a[href*="twitter.com"]');
        const isSmallElement = content.length < 1000;
        const hasOnlyEscapedContent = !hasDecodedPattern && !hasRendered && !hasFallback;
        
        const willProcess = hasEscapedPattern && hasOnlyEscapedContent && isSmallElement;
        
        if (willProcess) {
          // Decode HTML entities
          const decodedHtml = decodeHtmlEntities(content);
          
          // Replace the element's content with decoded HTML
          element.innerHTML = decodedHtml;
          element.setAttribute('data-html-fixed', 'true');
          processedElements.add(element);
        }
      });
      
      // Load Twitter widgets for any existing blockquotes
      setTimeout(() => {
        loadTwitterWidgets();
        fixCorruptedTwitterEmbeds();
        
        // Try loading widgets again after fixing
        setTimeout(() => {
          loadTwitterWidgets();
        }, 500);
        
        // Fallback: if widgets don't load, create clickable links
        setTimeout(() => {
          createFallbackLinks();
        }, 5000);
      }, 100);
      
      isProcessing = false;
    };

    const decodeHtmlEntities = (html: string): string => {
      // Create a temporary element to decode HTML entities
      const textarea = document.createElement('textarea');
      textarea.innerHTML = html;
      let decoded = textarea.value;
      
      // Fix specific malformed patterns
      decoded = decoded
        .replace(/&mdash">/g, '&mdash;')
        .replace(/June">/g, 'June')
        .replace(/pic\.twitter\.com\/https:\/\/t\.co\//g, 'pic.twitter.com/')
        .replace(/Junehttps:\/\/twitter\.com\//g, 'June https://twitter.com/')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      
      return decoded;
    };

    const loadTwitterWidgets = () => {
      const twitterEmbeds = document.querySelectorAll('blockquote.twitter-tweet');
      
      if (twitterEmbeds.length > 0) {
        if (window.twttr && window.twttr.widgets) {
          try {
            window.twttr.widgets.load();
          } catch (error) {
            // Silent fail
          }
        } else {
          loadTwitterScript();
        }
      } else {
        loadTwitterScript();
      }
    };

    const loadTwitterScript = () => {
      const existingScript = document.querySelector('script[src*="platform.twitter.com/widgets.js"]');
      if (existingScript) {
        let attempts = 0;
        const maxAttempts = 50;
        const checkWidgets = () => {
          attempts++;
          if (window.twttr && window.twttr.widgets) {
            try {
              window.twttr.widgets.load();
            } catch (error) {
              // Silent fail
            }
          } else if (attempts < maxAttempts) {
            setTimeout(checkWidgets, 100);
          }
        };
        checkWidgets();
      } else {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        script.onload = () => {
          setTimeout(() => {
            if (window.twttr && window.twttr.widgets) {
              try {
                window.twttr.widgets.load();
              } catch (error) {
                // Silent fail
              }
            }
          }, 200);
        };
        script.onerror = () => {
          // Silent fail
        };
        document.head.appendChild(script);
      }
    };

    const fixCorruptedTwitterEmbeds = () => {
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(element => {
        const content = element.innerHTML;
        
        if (content.includes('twitter-tweet') && 
            content.includes('blockquote') && 
            !element.hasAttribute('data-html-fixed') &&
            content.length < 5000 &&
            !element.tagName.match(/^(HTML|BODY|HEAD|FOOTER)$/i) &&
            !element.closest('footer') &&
            !element.closest('header') &&
            !element.closest('nav')) {
          
          const cleanEmbeds = element.querySelectorAll('blockquote.twitter-tweet');
          if (cleanEmbeds.length > 0) {
            element.setAttribute('data-html-fixed', 'true');
          }
          
          const textContent = element.textContent || '';
          if (textContent.includes('twitter-tweet') && textContent.includes('blockquote')) {
            const urlMatch = textContent.match(/https:\/\/twitter\.com\/[^\s"'>]+/);
            if (urlMatch) {
              let tweetUrl = urlMatch[0];
              tweetUrl = tweetUrl
                .replace(/[">\s]+$/, '')
                .replace(/&quot;.*$/, '')
                .replace(/&gt;.*$/, '')
                .replace(/&amp;.*$/, '')
                .trim();
              
              let originalHtml = element.innerHTML;
              
              const urlMatches = originalHtml.match(/https:\/\/twitter\.com\/[^\s"'>]+/g);
              
              const corruptedBlockquotePattern = /<blockquote[^>]*class[^>]*twitter-tweet[^>]*>[\s\S]*?<\/blockquote>/g;
              const corruptedMatches = originalHtml.match(corruptedBlockquotePattern);
              
              if (corruptedMatches && corruptedMatches.length > 0) {
                let fixedHtml = originalHtml;
                corruptedMatches.forEach((corruptedBlockquote) => {
                  const blockquoteUrlMatch = corruptedBlockquote.match(/https:\/\/twitter\.com\/[^\s"'>]+/);
                  let blockquoteUrl = blockquoteUrlMatch ? blockquoteUrlMatch[0] : tweetUrl;
                  
                  blockquoteUrl = blockquoteUrl
                    .replace(/[">\s]+$/, '')
                    .replace(/&quot;.*$/, '')
                    .replace(/&gt;.*$/, '')
                    .replace(/&amp;.*$/, '')
                    .trim();
                  
                  const cleanBlockquote = `
                    <blockquote class="twitter-tweet">
                      <p lang="en" dir="ltr">
                        <a href="${blockquoteUrl}">View Tweet</a>
                      </p>
                    </blockquote>
                  `;
                  
                  fixedHtml = fixedHtml.replace(corruptedBlockquote, cleanBlockquote);
                });
                
                element.innerHTML = fixedHtml;
                element.setAttribute('data-html-fixed', 'true');
              } else {
                const escapedPattern = /&lt;blockquote[^>]*class[^>]*twitter-tweet[^>]*&gt;[\s\S]*?&lt;\/blockquote&gt;/g;
                const escapedMatches = originalHtml.match(escapedPattern);
                
                if (escapedMatches && escapedMatches.length > 0) {
                  let fixedHtml = originalHtml;
                  escapedMatches.forEach((escapedBlockquote) => {
                    const blockquoteUrlMatch = escapedBlockquote.match(/https:\/\/twitter\.com\/[^\s"'>]+/);
                    let blockquoteUrl = blockquoteUrlMatch ? blockquoteUrlMatch[0] : tweetUrl;
                    
                    blockquoteUrl = blockquoteUrl
                      .replace(/[">\s]+$/, '')
                      .replace(/&quot;.*$/, '')
                      .replace(/&gt;.*$/, '')
                      .replace(/&amp;.*$/, '')
                      .trim();
                    
                    const cleanBlockquote = `
                      <blockquote class="twitter-tweet">
                        <p lang="en" dir="ltr">
                          <a href="${blockquoteUrl}">View Tweet</a>
                        </p>
                      </blockquote>
                    `;
                    
                    fixedHtml = fixedHtml.replace(escapedBlockquote, cleanBlockquote);
                  });
                  
                  element.innerHTML = fixedHtml;
                  element.setAttribute('data-html-fixed', 'true');
                } else {
                  const cleanBlockquote = `
                    <blockquote class="twitter-tweet">
                      <p lang="en" dir="ltr">
                        <a href="${tweetUrl}">View Tweet</a>
                      </p>
                    </blockquote>
                  `;
                  
                  element.innerHTML += cleanBlockquote;
                  element.setAttribute('data-html-fixed', 'true');
                }
              }
            }
          }
        }
      });
    };

    const createFallbackLinks = () => {
      const twitterEmbeds = document.querySelectorAll('blockquote.twitter-tweet');
      
      twitterEmbeds.forEach(embed => {
        const tweetLink = embed.querySelector('a[href*="twitter.com"]') as HTMLAnchorElement;
        if (tweetLink && tweetLink.href && !embed.hasAttribute('data-fallback-added')) {
          const fallbackLink = document.createElement('a');
          fallbackLink.href = tweetLink.href;
          fallbackLink.target = '_blank';
          fallbackLink.rel = 'noopener noreferrer';
          fallbackLink.textContent = 'View Tweet on Twitter';
          fallbackLink.style.cssText = `
            display: block;
            margin-top: 8px;
            padding: 8px 12px;
            background: #1da1f2;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
            text-align: center;
          `;
          
          embed.parentNode?.insertBefore(fallbackLink, embed.nextSibling);
          embed.setAttribute('data-fallback-added', 'true');
        }
      });
    };

    // Run the HTML fix process
    const timer = setTimeout(() => {
      fixEscapedHtml();
      
      setTimeout(() => {
        loadTwitterWidgets();
      }, 200);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return null;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: () => void;
      };
    };
  }
}