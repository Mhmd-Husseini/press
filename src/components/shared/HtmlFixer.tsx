'use client';

import { useEffect } from 'react';

export default function HtmlFixer() {
  useEffect(() => {
    const fixEscapedHtml = () => {
      // Find all spans containing escaped Twitter embeds
      const spans = document.querySelectorAll('span');
      let fixedCount = 0;
      
      spans.forEach((span) => {
        const spanContent = span.innerHTML;
        
        // Check if this span contains escaped Twitter embed
        if (spanContent.includes('&lt;blockquote class="twitter-tweet"&gt;')) {
          // Extract and decode the HTML
          const decodedHtml = spanContent
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
          
          // Create a temporary div to hold the decoded HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = decodedHtml;
          
          // Replace the span with the decoded content
          if (span.parentNode) {
            // Insert the decoded content before the span
            while (tempDiv.firstChild) {
              span.parentNode.insertBefore(tempDiv.firstChild, span);
            }
            // Remove the original span
            span.parentNode.removeChild(span);
            fixedCount++;
          }
        }
      });
      
      // Load Twitter widgets after fixing
      if (fixedCount > 0) {
        setTimeout(() => {
          loadTwitterWidgets();
          // Fallback: if widgets don't load, create clickable links
          setTimeout(() => {
            createFallbackLinks();
          }, 2000);
        }, 100);
      }
    };


    const loadTwitterWidgets = () => {
      // Try multiple approaches to load Twitter widgets
      const tryLoadWidgets = () => {
        if (window.twttr && window.twttr.widgets) {
          try {
            window.twttr.widgets.load();
          } catch (error) {
            console.error('HtmlFixer: Error calling Twitter widgets.load():', error);
          }
          return true;
        }
        return false;
      };

      // First try: if widgets are already available
      if (tryLoadWidgets()) {
        return;
      }

      // Second try: check if script exists and wait for it
      const existingScript = document.querySelector('script[src*="platform.twitter.com/widgets.js"]');
      if (existingScript) {
        let attempts = 0;
        const maxAttempts = 10; // 1 second max
        const checkWidgets = () => {
          attempts++;
          if (tryLoadWidgets()) {
            return; // Success!
          } else if (attempts < maxAttempts) {
            setTimeout(checkWidgets, 100);
          } else {
            // Try to reload the script
            existingScript.remove();
            loadNewTwitterScript();
          }
        };
        checkWidgets();
        return;
      }

      // Third try: load new script
      loadNewTwitterScript();
    };

    const loadNewTwitterScript = () => {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      script.onload = () => {
        // Wait a bit for initialization
        setTimeout(() => {
          if (window.twttr && window.twttr.widgets) {
            try {
              window.twttr.widgets.load();
            } catch (error) {
              console.error('HtmlFixer: Error calling Twitter widgets.load():', error);
            }
          }
        }, 500);
      };
      script.onerror = () => {
        console.error('HtmlFixer: Failed to load Twitter script');
      };
      document.head.appendChild(script);
    };

    const createFallbackLinks = () => {
      // Find all blockquote.twitter-tweet elements that haven't been processed
      const twitterEmbeds = document.querySelectorAll('blockquote.twitter-tweet');
      
      twitterEmbeds.forEach((blockquote) => {
        // Check if this embed has been processed by Twitter widgets
        if (!blockquote.querySelector('.twitter-tweet-rendered')) {
          
          // Extract the tweet link
          const tweetLink = blockquote.querySelector('a[href*="/status/"]');
          if (tweetLink) {
            const tweetUrl = tweetLink.href;
            const tweetText = blockquote.textContent || 'View Tweet';
            
            // Create a fallback link
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'twitter-fallback';
            fallbackDiv.style.cssText = `
              border: 1px solid #e1e8ed;
              border-radius: 8px;
              padding: 16px;
              margin: 16px 0;
              background: #f7f9fa;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            `;
            
            fallbackDiv.innerHTML = `
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1da1f2" style="margin-right: 8px;">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span style="font-weight: bold; color: #1da1f2;">Twitter</span>
              </div>
              <div style="margin-bottom: 12px; color: #14171a; line-height: 1.4;">
                ${tweetText.substring(0, 100)}${tweetText.length > 100 ? '...' : ''}
              </div>
              <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" 
                 style="color: #1da1f2; text-decoration: none; font-weight: bold;">
                View on Twitter →
              </a>
            `;
            
            // Replace the blockquote with the fallback
            blockquote.parentNode?.replaceChild(fallbackDiv, blockquote);
          }
        }
      });
    };


    // Run the fix immediately for faster loading
    const timer = setTimeout(fixEscapedHtml, 100);

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
