'use client';

import { useEffect } from 'react';

export default function HtmlFixer() {
  useEffect(() => {
    let isProcessing = false;
    
    const fixEscapedHtml = () => {
      if (isProcessing) return;
      
      isProcessing = true;
      
      const processedElements = new Set();
      
      // Find elements that contain escaped social media embeds
      const elements = document.querySelectorAll('div, span, p, article, section');
      
      elements.forEach(element => {
        if (processedElements.has(element) || element.hasAttribute('data-html-fixed')) {
          return;
        }
        
        const content = element.innerHTML;
        const textContent = element.textContent || '';
        
        // Check for escaped Twitter embeds
        const hasEscapedTwitter = content.includes('&lt;blockquote class="twitter-tweet"&gt;') &&
                                 content.includes('&lt;p lang="zxx"') &&
                                 content.includes('&lt;a href="') &&
                                 content.includes('&lt;/blockquote&gt;');
        
        // Check for escaped Truth Social embeds
        const hasEscapedTruthSocial = content.includes('&lt;iframe src="https://truthsocial.com/') &&
                                     content.includes('truthsocial-embed') &&
                                     content.includes('&lt;/iframe&gt;');
        
        // Check for escaped Facebook embeds
        const hasEscapedFacebook = content.includes('&lt;iframe src="https://www.facebook.com/plugins/') &&
                                 content.includes('&lt;/iframe&gt;');
        
        // Check for unescaped Truth Social embeds (raw HTML)
        const hasRawTruthSocial = content.includes('<iframe src="https://truthsocial.com/') &&
                                 content.includes('truthsocial-embed') &&
                                 content.includes('</iframe>');
        
        // Check for unescaped Facebook embeds (raw HTML)
        const hasRawFacebook = content.includes('<iframe src="https://www.facebook.com/plugins/') &&
                              content.includes('</iframe>');
        
        const hasDecodedPattern = content.includes('<blockquote class="twitter-tweet">') ||
                                 content.includes('<iframe src="https://truthsocial.com/') ||
                                 content.includes('<iframe src="https://www.facebook.com/plugins/');
        
        const hasRendered = element.querySelector('blockquote.twitter-tweet') ||
                           element.querySelector('iframe[src*="truthsocial.com"]') ||
                           element.querySelector('iframe[src*="facebook.com"]');
        
        const hasFallback = element.querySelector('a[href*="twitter.com"]') ||
                           element.querySelector('a[href*="truthsocial.com"]') ||
                           element.querySelector('a[href*="facebook.com"]');
        
        const isSmallElement = content.length < 2000; // Increased for larger embeds
        const hasOnlyEscapedContent = !hasDecodedPattern && !hasRendered && !hasFallback;
        
        const willProcess = (hasEscapedTwitter || hasEscapedTruthSocial || hasEscapedFacebook || hasRawTruthSocial || hasRawFacebook) && 
                           hasOnlyEscapedContent && isSmallElement;
        
        if (willProcess) {
          let processedHtml = content;
          
          // If it's escaped HTML, decode it first
          if (hasEscapedTwitter || hasEscapedTruthSocial || hasEscapedFacebook) {
            processedHtml = decodeHtmlEntities(content);
          }
          
          // For raw HTML, we need to ensure the embeds are properly formatted
          if (hasRawTruthSocial || hasRawFacebook) {
            processedHtml = processRawEmbeds(content);
          }
          
          // Replace the element's content with processed HTML
          element.innerHTML = processedHtml;
          element.setAttribute('data-html-fixed', 'true');
          processedElements.add(element);
        }
      });
      
      // Load social media widgets for any existing embeds
      setTimeout(() => {
        loadSocialMediaWidgets();
        fixCorruptedSocialEmbeds();
        
        // Try loading widgets again after fixing
        setTimeout(() => {
          loadSocialMediaWidgets();
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

    const processRawEmbeds = (html: string): string => {
      let processed = html;
      
      // Process Truth Social embeds
      const truthSocialPattern = /<iframe src="https:\/\/truthsocial\.com\/[^"]*" class="truthsocial-embed"[^>]*><\/iframe><script src="https:\/\/truthsocial\.com\/embed\.js" async="async"><\/script>/g;
      processed = processed.replace(truthSocialPattern, (match) => {
        // Extract the iframe part and return it (script will be loaded separately)
        const iframeMatch = match.match(/<iframe[^>]*><\/iframe>/);
        return iframeMatch ? iframeMatch[0] : match;
      });
      
      // Process Facebook embeds
      const facebookPattern = /<iframe src="https:\/\/www\.facebook\.com\/plugins\/[^"]*"[^>]*><\/iframe>/g;
      processed = processed.replace(facebookPattern, (match) => {
        // Facebook embeds work as-is, just return the iframe
        return match;
      });
      
      return processed;
    };

    const loadSocialMediaWidgets = () => {
      const twitterEmbeds = document.querySelectorAll('blockquote.twitter-tweet');
      const truthSocialEmbeds = document.querySelectorAll('iframe[src*="truthsocial.com"]');
      const facebookEmbeds = document.querySelectorAll('iframe[src*="facebook.com"]');
      
      // Load Twitter widgets
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
      
      // Load Truth Social widgets
      if (truthSocialEmbeds.length > 0) {
        loadTruthSocialScript();
      }
      
      // Facebook embeds don't need additional scripts - they work with iframes
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

    const loadTruthSocialScript = () => {
      const existingScript = document.querySelector('script[src*="truthsocial.com/embed.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://truthsocial.com/embed.js';
        script.async = true;
        script.onload = () => {
          // Truth Social embeds should work automatically after script loads
        };
        script.onerror = () => {
          // Silent fail
        };
        document.head.appendChild(script);
      }
    };

    const fixCorruptedSocialEmbeds = () => {
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(element => {
        const content = element.innerHTML;
        
        // Check for any social media content
        const hasSocialContent = content.includes('twitter-tweet') || 
                                content.includes('truthsocial.com') || 
                                content.includes('facebook.com');
        
        if (hasSocialContent && 
            !element.hasAttribute('data-html-fixed') &&
            content.length < 5000 &&
            !element.tagName.match(/^(HTML|BODY|HEAD|FOOTER)$/i) &&
            !element.closest('footer') &&
            !element.closest('header') &&
            !element.closest('nav')) {
          
          // Check for clean embeds
          const cleanEmbeds = element.querySelectorAll('blockquote.twitter-tweet, iframe[src*="truthsocial.com"], iframe[src*="facebook.com"]');
          if (cleanEmbeds.length > 0) {
            element.setAttribute('data-html-fixed', 'true');
          }
          
          // Handle Twitter embeds
          if (content.includes('twitter-tweet') && content.includes('blockquote')) {
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
          
          // Handle Truth Social embeds
          if (content.includes('truthsocial.com')) {
            const textContent = element.textContent || '';
            if (textContent.includes('truthsocial.com')) {
              const urlMatch = textContent.match(/https:\/\/truthsocial\.com\/[^\s"'>]+/);
              if (urlMatch) {
                let truthUrl = urlMatch[0];
                truthUrl = truthUrl
                  .replace(/[">\s]+$/, '')
                  .replace(/&quot;.*$/, '')
                  .replace(/&gt;.*$/, '')
                  .replace(/&amp;.*$/, '')
                  .trim();
                
                       const cleanIframe = `
                         <iframe src="${truthUrl}/embed" class="truthsocial-embed" style="max-width: 100%; border: 0" width="600" allowfullscreen="allowfullscreen"></iframe>
                       `;

                       element.innerHTML += cleanIframe;
                       element.setAttribute('data-html-fixed', 'true');
                       
                       // Remove any existing fallback buttons
                       const existingButtons = element.querySelectorAll('a[href*="truthsocial.com"]');
                       existingButtons.forEach(button => {
                         if (button.textContent?.includes('View Post on Truth Social')) {
                           button.remove();
                         }
                       });
              }
            }
          }
          
          // Handle Facebook embeds
          if (content.includes('facebook.com')) {
            const textContent = element.textContent || '';
            if (textContent.includes('facebook.com')) {
              const urlMatch = textContent.match(/https:\/\/www\.facebook\.com\/[^\s"'>]+/);
              if (urlMatch) {
                let fbUrl = urlMatch[0];
                fbUrl = fbUrl
                  .replace(/[">\s]+$/, '')
                  .replace(/&quot;.*$/, '')
                  .replace(/&gt;.*$/, '')
                  .replace(/&amp;.*$/, '')
                  .trim();
                
                const encodedUrl = encodeURIComponent(fbUrl);
                       const cleanIframe = `
                         <iframe src="https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500" width="500" height="709" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
                       `;

                       element.innerHTML += cleanIframe;
                       element.setAttribute('data-html-fixed', 'true');
                       
                       // Remove any existing fallback buttons
                       const existingButtons = element.querySelectorAll('a[href*="facebook.com"]');
                       existingButtons.forEach(button => {
                         if (button.textContent?.includes('View Post on Facebook')) {
                           button.remove();
                         }
                       });
              }
            }
          }
        }
      });
    };

           const createFallbackLinks = () => {
             // Only create Twitter fallback links (keep Truth Social and Facebook embeds clean)
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

             // Remove any existing Truth Social fallback buttons
             const existingTruthSocialButtons = document.querySelectorAll('a[href*="truthsocial.com"]');
             existingTruthSocialButtons.forEach(button => {
               if (button.textContent?.includes('View Post on Truth Social')) {
                 button.remove();
               }
             });

             // Remove any existing Facebook fallback buttons
             const existingFacebookButtons = document.querySelectorAll('a[href*="facebook.com"]');
             existingFacebookButtons.forEach(button => {
               if (button.textContent?.includes('View Post on Facebook')) {
                 button.remove();
               }
             });
           };

    // Run the HTML fix process
    const timer = setTimeout(() => {
      fixEscapedHtml();
      
      setTimeout(() => {
        loadSocialMediaWidgets();
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