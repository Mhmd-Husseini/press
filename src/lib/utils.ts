import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names or class name objects into a single string,
 * handling Tailwind CSS class conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a localized string
 */
export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncates a string to a specified length and adds an ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Formats a filename to ensure it's URL safe
 */
export function formatFilename(filename: string): string {
  if (!filename) return '';
  
  // Replace spaces with dashes
  let formattedName = filename.toLowerCase().replace(/\s+/g, '-');
  
  // Remove special characters
  formattedName = formattedName.replace(/[^\w-]/g, '');
  
  return formattedName;
}

/**
 * Extracts the text content from HTML
 */
export function getTextFromHtml(html: string): string {
  if (!html) return '';
  
  // Create temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Return the text content
  return temp.textContent || temp.innerText || '';
}

/**
 * Format a date string to a readable format
 * @param dateString The date string to format
 * @param locale The locale for date formatting
 * @returns Formatted date string
 */
export const formatDateLocalized = (dateString: string, locale: string = 'en'): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return '';
  }
  
  const localeString = locale === 'ar' ? 'ar-AE' : 'en-US';
  
  return new Intl.DateTimeFormat(localeString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

/**
 * Truncate text to a specific length and add ellipsis
 * @param text The text to truncate
 * @param length The maximum length
 * @returns Truncated text
 */
export const truncateTextWithEllipsis = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

/**
 * Generate a random array of items from a larger array
 * @param array The source array
 * @param count The number of items to select
 * @returns Random selection of items
 */
export const getRandomItems = <T>(array: T[], count: number): T[] => {
  if (count >= array.length) return [...array];
  
  const result = new Set<T>();
  const arrayCopy = [...array];
  
  while (result.size < count && arrayCopy.length > 0) {
    const randomIndex = Math.floor(Math.random() * arrayCopy.length);
    result.add(arrayCopy[randomIndex]);
    arrayCopy.splice(randomIndex, 1);
  }
  
  return [...result];
};

/**
 * Get a localized value from an array of translations
 * @param translations Array of objects with locale and value
 * @param locale Current locale
 * @param fallbackLocale Fallback locale if current not found
 * @param field The field name to extract
 * @returns The localized value or undefined
 */
export const getLocalizedValue = <T extends { locale: string }>(
  translations: T[] | undefined,
  locale: string,
  fallbackLocale: string = 'en',
  field: keyof Omit<T, 'locale'> = 'name' as any
): string | undefined => {
  if (!translations || translations.length === 0) return undefined;
  
  // Try to find the translation in the requested locale
  const localizedItem = translations.find(t => t.locale === locale);
  if (localizedItem) return localizedItem[field] as string;
  
  // Fall back to the fallback locale
  const fallbackItem = translations.find(t => t.locale === fallbackLocale);
  if (fallbackItem) return fallbackItem[field] as string;
  
  // If all else fails, return the first available translation
  return translations[0][field] as string;
}; 

/**
 * Generate a slug from title and date for both English and Arabic posts
 * @param title - The post title
 * @param locale - The locale ('en' or 'ar')
 * @param date - The post date (defaults to current date)
 * @returns A URL-friendly slug
 */
export function generatePostSlug(title: string, locale: string, date: Date = new Date()): string {
  if (!title) return '';
  
  // Format date as YYYY-MM-DD
  const dateStr = date.toISOString().split('T')[0];
  
  // Clean the title based on locale
  let cleanTitle: string;
  
  if (locale === 'ar') {
    // For Arabic, remove special characters and convert spaces to hyphens
    // Keep Arabic characters, numbers, and basic punctuation
    cleanTitle = title
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  } else {
    // For English and other languages, use standard slugification
    cleanTitle = title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  
  // Combine date and title: YYYY-MM-DD-title
  return `${dateStr}-${cleanTitle}`;
}

/**
 * Create optimized description for social media sharing
 * @param content - The content to create description from
 * @param maxLength - Maximum length (default 160 for Open Graph)
 * @returns Optimized description string
 */
export const createSocialDescription = (content: string, maxLength: number = 160): string => {
  if (!content) return '';
  
  // Remove HTML tags and clean up whitespace
  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  // Find the last complete word within the limit
  const truncated = cleanContent.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    // If we can find a good breaking point, use it
    return truncated.substring(0, lastSpace) + '...';
  } else {
    // Otherwise, just truncate and add ellipsis
    return truncated + '...';
  }
};

/**
 * Generate a unique slug by appending a counter if needed
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export function makeSlugUnique(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
} 