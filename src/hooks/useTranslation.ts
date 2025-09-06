import { useState, useCallback } from 'react';

interface TranslationOptions {
  text: string;
  sourceLang: 'ar' | 'en';
  targetLang: 'ar' | 'en';
  type?: 'text' | 'html';
}

interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (options: TranslationOptions): Promise<TranslationResult | null> => {
    const { text, sourceLang, targetLang, type = 'text' } = options;

    if (!text.trim()) {
      return {
        translatedText: '',
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    }

    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
          type
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Translation failed');
      }

      return {
        translatedText: data.translatedText,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      console.error('Translation error:', err);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const translateText = useCallback((text: string, sourceLang: 'ar' | 'en', targetLang: 'ar' | 'en') => {
    return translate({ text, sourceLang, targetLang, type: 'text' });
  }, [translate]);

  const translateHtml = useCallback((html: string, sourceLang: 'ar' | 'en', targetLang: 'ar' | 'en') => {
    return translate({ text: html, sourceLang, targetLang, type: 'html' });
  }, [translate]);

  return {
    translate,
    translateText,
    translateHtml,
    isTranslating,
    error
  };
}
