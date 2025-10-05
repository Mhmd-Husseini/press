# How to Clear Social Media Cache for Ektisadi.com Posts

After updating the Open Graph metadata, social media platforms cache the old preview. You need to clear this cache to see the new, properly formatted previews.

## 🔄 Clear Cache on Different Platforms

### 1. **WhatsApp**
WhatsApp caches link previews very aggressively. To force a refresh:

**Option A: WhatsApp Link Preview Debugger**
1. Visit: https://developers.facebook.com/tools/debug/
2. Paste your post URL (e.g., `https://ektisadi.com/posts/2025-10-05-هل-يقود-الذكاء-الاصطناعي-إصلاح-قطاع-الطاقة-في-لبنان؟`)
3. Click "Scrape Again" button (you may need to click it multiple times)
4. Wait 5-10 minutes for WhatsApp to update its cache
5. Try sharing the link again

**Option B: Add a Query Parameter**
- Temporarily add `?v=2` to the URL when sharing: `https://ektisadi.com/posts/your-slug?v=2`
- This forces WhatsApp to fetch fresh metadata
- After cache clears, the original URL will work

### 2. **Facebook**
Facebook and WhatsApp share the same cache infrastructure.

1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your post URL
3. Click "Scrape Again" button
4. Check the preview in the "Link Preview" section
5. If needed, click "Scrape Again" again
6. Test sharing on Facebook

### 3. **Twitter/X**
Twitter has its own card validator:

1. Visit: https://cards-dev.twitter.com/validator
2. Enter your post URL
3. Click "Preview card"
4. If the preview looks good, the cache is cleared
5. Test sharing on Twitter/X

### 4. **LinkedIn**
LinkedIn caches aggressively:

1. Visit: https://www.linkedin.com/post-inspector/
2. Enter your post URL
3. Click "Inspect"
4. Check the preview
5. You may need to clear the cache multiple times

### 5. **Telegram**
Telegram caches link previews:

1. Open Telegram Web or Desktop
2. Send the link to "Saved Messages"
3. Delete the message
4. Wait 5 minutes
5. Send the link again - it should show the new preview

### 6. **Discord**
Discord has its own embed system:

1. Post the link in a private channel or DM
2. If it doesn't show correctly, add `?v=2` to the URL
3. After caching updates, the original URL will work

## 📋 Testing Checklist

After deploying the metadata changes and clearing caches:

- [ ] Test Arabic post sharing on WhatsApp
- [ ] Test English post sharing on WhatsApp
- [ ] Test Arabic post on Facebook
- [ ] Test English post on Facebook
- [ ] Test on Twitter/X
- [ ] Test on LinkedIn
- [ ] Test on Telegram
- [ ] Verify image displays correctly (1200x630px)
- [ ] Verify Arabic title displays without encoding
- [ ] Verify description shows properly

## 🔍 Debug Tips

### Check Current Metadata
Use these tools to see what metadata is currently being served:

1. **View Page Source**: Right-click → "View Page Source" → Search for `<meta property="og:`
2. **Browser DevTools**: Open DevTools → Network tab → Reload page → Check HTML response
3. **Online Tools**:
   - https://www.opengraph.xyz/ - Preview Open Graph tags
   - https://metatags.io/ - Comprehensive meta tag checker
   - https://cards-dev.twitter.com/validator - Twitter card validator

### Verify Arabic URLs
The URL should display as:
```
https://ektisadi.com/posts/2025-10-05-هل-يقود-الذكاء-الاصطناعي-إصلاح-قطاع-الطاقة-في-لبنان؟
```

NOT as:
```
https://ektisadi.com/posts/2025-10-05-%D9%87%D9%84-%D9%8A%D9%82%D9%88%D8%AF-...
```

## ⚠️ Important Notes

1. **Cache Duration**: Different platforms have different cache durations:
   - WhatsApp/Facebook: 7-30 days
   - Twitter: 7 days
   - LinkedIn: 7 days
   - Telegram: 3-7 days

2. **First Share**: The first time a URL is shared, it will be cached. Subsequent shares use the cached version.

3. **Production Deployment**: Make sure your changes are deployed to production (`https://ektisadi.com`), not just staging.

4. **Arabic Characters**: Modern browsers and social platforms support Arabic characters in URLs (RFC 3987 - IRIs).

## 🚀 Force Immediate Update

If you need immediate results:

1. Deploy the metadata changes to production
2. Clear all platform caches using the tools above
3. Add a version query parameter: `?v=2` or `?refresh=1`
4. Share with the query parameter
5. After 24 hours, the original URL will work with cached new metadata

## 📞 Need Help?

If previews still don't work after 24 hours:
- Check server logs for any errors
- Verify DNS is pointing to correct server
- Ensure SSL certificate is valid
- Check if social platform bots can access your site (not blocked by firewall/CloudFlare)

