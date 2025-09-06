# Translation Setup Guide

This guide explains how to set up automatic translation for your bilingual content management system.

## Features Added

✅ **Automatic Translation**: Translate content between Arabic and English
✅ **Individual Field Translation**: Translate title, summary, and content separately
✅ **Bulk Translation**: Translate all fields at once
✅ **HTML Content Support**: Handles rich text editor content
✅ **Auto Slug Generation**: Automatically generates slugs for translated titles
✅ **Error Handling**: Shows translation errors with fallback to original text

## How It Works

### For Content Creators

1. **Write in One Language**: Start by writing your content in Arabic or English
2. **Use Translation Buttons**: Click the translation buttons (→ EN or → AR) next to each field
3. **Bulk Translation**: Use "AR → EN All" or "EN → AR All" buttons to translate everything at once
4. **Review and Edit**: Review the translated content and make any necessary adjustments
5. **Publish**: Save and publish your bilingual post

### Translation Buttons

- **Individual Field Buttons**: 
  - `→ EN`: Translate Arabic content to English
  - `→ AR`: Translate English content to Arabic
- **Bulk Translation Buttons**:
  - `AR → EN All`: Translate all Arabic fields to English
  - `EN → AR All`: Translate all English fields to Arabic

## Setup Instructions

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Translation API Configuration
TRANSLATION_API_KEY=your_api_key_here
TRANSLATION_API_URL=https://api.mymemory.translated.net
```

### 2. Translation Service Options

#### Option A: MyMemory (Free)
- **URL**: `https://api.mymemory.translated.net`
- **Cost**: Free (with rate limits)
- **Quality**: Good for basic translations
- **Setup**: No API key required

#### Option B: Google Translate API
- **URL**: `https://translation.googleapis.com/language/translate/v2`
- **Cost**: Pay-per-use
- **Quality**: Excellent
- **Setup**: Requires Google Cloud API key

#### Option C: Azure Translator
- **URL**: `https://api.cognitive.microsofttranslator.com/translate`
- **Cost**: Pay-per-use
- **Quality**: Excellent
- **Setup**: Requires Azure subscription

### 3. Update Translation Service

To use a different translation service, modify `src/lib/services/translation.service.ts`:

```typescript
// For Google Translate API
const response = await fetch(
  `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'html'
    })
  }
);
```

## Usage Examples

### Scenario 1: Arabic-First Workflow
1. Write your post in Arabic
2. Click "AR → EN All" to translate everything to English
3. Review and edit the English translation
4. Publish your bilingual post

### Scenario 2: English-First Workflow
1. Write your post in English
2. Click "EN → AR All" to translate everything to Arabic
3. Review and edit the Arabic translation
4. Publish your bilingual post

### Scenario 3: Mixed Workflow
1. Write title in Arabic, click "→ EN"
2. Write summary in English, click "→ AR"
3. Write content in Arabic, click "→ EN"
4. Review all translations and publish

## Technical Details

### Files Modified/Created

1. **`src/lib/services/translation.service.ts`** - Translation service
2. **`src/app/api/translate/route.ts`** - Translation API endpoint
3. **`src/hooks/useTranslation.ts`** - Translation hook for React components
4. **`src/components/admin/posts/PostForm.tsx`** - Updated with translation UI

### Translation Flow

1. User clicks translation button
2. Frontend calls `/api/translate` endpoint
3. API calls translation service
4. Service returns translated text
5. Frontend updates form fields
6. Auto-generates slugs for translated titles

## Troubleshooting

### Common Issues

1. **Translation Not Working**
   - Check if translation API is accessible
   - Verify environment variables are set
   - Check browser console for errors

2. **Poor Translation Quality**
   - Consider upgrading to a premium translation service
   - Review and edit translations manually
   - Use shorter, simpler sentences

3. **Rate Limiting**
   - Implement caching for repeated translations
   - Use a premium service with higher limits
   - Add delays between translation requests

### Error Handling

The system includes comprehensive error handling:
- **API Failures**: Falls back to original text
- **Network Issues**: Shows error message to user
- **Invalid Input**: Validates input before translation
- **Rate Limits**: Handles rate limiting gracefully

## Future Enhancements

- **Translation Memory**: Cache common translations
- **Quality Scoring**: Rate translation quality
- **Custom Dictionaries**: Add domain-specific terms
- **Batch Processing**: Translate multiple posts at once
- **Translation History**: Track translation changes
