/**
 * These utilities are safe to use on the client side as they only work with 
 * public URLs and don't require AWS credentials
 */

// Get the S3 URL from environment variable
export const S3_URL = process.env.NEXT_PUBLIC_S3_URL || 'https://inventory-managment-husseini.s3.eu-north-1.amazonaws.com';

/**
 * Gets the full URL for an S3 key
 */
export function getS3Url(key: string): string {
  if (!key) return '';
  if (key.startsWith('http')) return key;
  return `${S3_URL}/${key.startsWith('/') ? key.slice(1) : key}`;
}

/**
 * Gets the default image URL (placeholder)
 */
export function getDefaultImageUrl(): string {
  // Use a simple gray placeholder image as a data URL
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjQwMCIgeT0iMjUwIiBmb250LWZhbWlseT0iQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNnB4IiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
}

/**
 * Gets the image URL from a media object or array
 */
export function getImageUrl(media: any, defaultImage: string = ''): string {
  if (!media) return defaultImage || getDefaultImageUrl();
  
  // If media is an array, get the first item
  if (Array.isArray(media)) {
    if (media.length === 0) return defaultImage || getDefaultImageUrl();
    media = media[0];
  }
  
  // Handle media object
  if (typeof media === 'object' && media.url) {
    return media.url;
  }
  
  // Handle string (direct URL)
  if (typeof media === 'string') {
    return media;
  }
  
  return defaultImage || getDefaultImageUrl();
}

/**
 * Gets the image alt text from a media object
 */
export function getImageAlt(media: any, defaultAlt: string = 'Image'): string {
  if (!media) return defaultAlt;
  
  // If media is an array, get the first item
  if (Array.isArray(media) && media.length > 0) {
    media = media[0];
  }
  
  // Handle media object
  if (typeof media === 'object' && media.altText) {
    return media.altText;
  }
  
  return defaultAlt;
} 