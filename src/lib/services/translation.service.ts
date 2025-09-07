/**
 * Translation Service
 * Handles automatic translation between Arabic and English
 */

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export class TranslationService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // You can use Google Translate API, Azure Translator, or any other service
    // For demo purposes, we'll use a free service or mock implementation
    this.apiKey = process.env.TRANSLATION_API_KEY || '';
    this.baseUrl = process.env.TRANSLATION_API_URL || 'https://api.mymemory.translated.net';
  }

  /**
   * Translate text from one language to another
   */
  async translateText(
    text: string, 
    sourceLang: 'ar' | 'en', 
    targetLang: 'ar' | 'en'
  ): Promise<TranslationResult> {
    if (!text.trim()) {
      return {
        translatedText: '',
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    }

    // If source and target are the same, return original text
    if (sourceLang === targetLang) {
      return {
        translatedText: text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    }

    try {
      // For production, you would use a proper translation service
      // Here's an example using MyMemory (free service)
      const response = await fetch(
        `${this.baseUrl}/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.responseStatus !== 200) {
        throw new Error(`Translation failed: ${data.responseStatus}`);
      }

      return {
        translatedText: data.responseData.translatedText || text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    } catch (error) {
      console.error('Translation error:', error);
      
      // Fallback: return original text if translation fails
      return {
        translatedText: text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    }
  }

  /**
   * Translate HTML content (for rich text editor content)
   */
  async translateHtmlContent(
    htmlContent: string,
    sourceLang: 'ar' | 'en',
    targetLang: 'ar' | 'en'
  ): Promise<TranslationResult> {
    if (!htmlContent || !htmlContent.trim()) {
      return {
        translatedText: '',
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    }

    try {
      // Parse HTML and translate text nodes while preserving structure
      const translatedHtml = await this.translateHtmlStructure(htmlContent, sourceLang, targetLang);
      
      return {
        translatedText: translatedHtml,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    } catch (error) {
      console.error('HTML translation error:', error);
      return {
        translatedText: htmlContent,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    }
  }

  /**
   * Translate HTML structure while preserving formatting
   */
  private async translateHtmlStructure(
    html: string,
    sourceLang: 'ar' | 'en',
    targetLang: 'ar' | 'en'
  ): Promise<string> {
    // Split HTML into text nodes and HTML tags
    const parts = html.split(/(<[^>]*>)/);
    const translatedParts: string[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // If it's an HTML tag, keep it as is
      if (part.startsWith('<') && part.endsWith('>')) {
        translatedParts.push(part);
      } else if (part.trim()) {
        // If it's text content, translate it
        const translation = await this.translateText(part, sourceLang, targetLang);
        translatedParts.push(translation.translatedText);
      } else {
        // Empty or whitespace-only parts
        translatedParts.push(part);
      }
    }
    
    return translatedParts.join('');
  }

  /**
   * Extract plain text from HTML content
   */
  private extractTextFromHtml(html: string): string {
    // Simple HTML tag removal - in production you might want to use a proper HTML parser
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .trim();
  }

  /**
   * Generate slug from translated title
   */
  async generateTranslatedSlug(
    title: string,
    sourceLang: 'ar' | 'en',
    targetLang: 'ar' | 'en'
  ): Promise<string> {
    if (sourceLang === targetLang) {
      return this.generateSlug(title);
    }

    try {
      const translation = await this.translateText(title, sourceLang, targetLang);
      return this.generateSlug(translation.translatedText);
    } catch (error) {
      console.error('Slug generation error:', error);
      return this.generateSlug(title);
    }
  }

  /**
   * Generate URL-friendly slug from text
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
}

// Export singleton instance
export const translationService = new TranslationService();
