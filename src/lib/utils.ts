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