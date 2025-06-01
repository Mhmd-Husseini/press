/**
 * Typography Utility Functions
 * 
 * Provides consistent typography class selection across the application
 * Supports both English (LTR) and Arabic (RTL) layouts
 */

export interface TypographyOptions {
  isRTL?: boolean;
  additionalClasses?: string;
}

/**
 * Heading classes for different hierarchy levels
 */
export const getHeadingClass = (level: 'hero' | '1' | '2' | '3' | '4' | '5', options: TypographyOptions = {}) => {
  const { isRTL = false, additionalClasses = '' } = options;
  
  const headingMap = {
    hero: isRTL ? 'ar-heading-hero' : 'heading-hero',
    '1': isRTL ? 'ar-heading-1' : 'heading-1',
    '2': isRTL ? 'ar-heading-2' : 'heading-2',
    '3': isRTL ? 'ar-heading-3' : 'heading-3',
    '4': isRTL ? 'ar-heading-4' : 'heading-4',
    '5': isRTL ? 'ar-heading-5' : 'heading-5',
  };
  
  return `${headingMap[level]} ${additionalClasses}`.trim();
};

/**
 * Body text classes for different sizes
 */
export const getTextClass = (size: 'large' | 'body' | 'small' | 'xs', options: TypographyOptions = {}) => {
  const { isRTL = false, additionalClasses = '' } = options;
  
  const textMap = {
    large: isRTL ? 'ar-text-large' : 'text-large',
    body: isRTL ? 'ar-text-body' : 'text-body',
    small: isRTL ? 'ar-text-small' : 'text-small',
    xs: isRTL ? 'ar-text-xs-custom' : 'text-xs-custom',
  };
  
  return `${textMap[size]} ${additionalClasses}`.trim();
};

/**
 * Component-specific typography classes
 */
export const getComponentClass = (
  component: 'nav-link' | 'btn' | 'card-title' | 'category-label' | 'meta' | 'post-title-large' | 'post-title-medium' | 'post-title-small',
  options: TypographyOptions = {}
) => {
  const { isRTL = false, additionalClasses = '' } = options;
  
  const componentMap = {
    'nav-link': isRTL ? 'ar-nav-link' : 'nav-link',
    'btn': isRTL ? 'ar-btn-text' : 'btn-text',
    'card-title': isRTL ? 'ar-card-title' : 'card-title',
    'category-label': isRTL ? 'ar-category-label' : 'category-label',
    'meta': isRTL ? 'ar-meta-text' : 'meta-text',
    'post-title-large': isRTL ? 'ar-post-title-large' : 'post-title-large',
    'post-title-medium': isRTL ? 'ar-post-title-medium' : 'post-title-medium',
    'post-title-small': isRTL ? 'ar-post-title-small' : 'post-title-small',
  };
  
  return `${componentMap[component]} ${additionalClasses}`.trim();
};

/**
 * Link classes with different styles
 */
export const getLinkClass = (style: 'primary' | 'secondary', options: TypographyOptions = {}) => {
  const { isRTL = false, additionalClasses = '' } = options;
  
  const linkMap = {
    primary: isRTL ? 'ar-link-primary' : 'link-primary',
    secondary: isRTL ? 'ar-link-secondary' : 'link-secondary',
  };
  
  return `${linkMap[style]} ${additionalClasses}`.trim();
};

/**
 * Utility to get typography classes based on locale
 */
export const getTypographyClasses = (locale: string) => {
  const isRTL = locale === 'ar';
  
  return {
    isRTL,
    heading: (level: Parameters<typeof getHeadingClass>[0], additionalClasses?: string) => 
      getHeadingClass(level, { isRTL, additionalClasses }),
    text: (size: Parameters<typeof getTextClass>[0], additionalClasses?: string) => 
      getTextClass(size, { isRTL, additionalClasses }),
    component: (component: Parameters<typeof getComponentClass>[0], additionalClasses?: string) => 
      getComponentClass(component, { isRTL, additionalClasses }),
    link: (style: Parameters<typeof getLinkClass>[0], additionalClasses?: string) => 
      getLinkClass(style, { isRTL, additionalClasses }),
  };
};

/**
 * Type definitions for TypeScript support
 */
export type HeadingLevel = 'hero' | '1' | '2' | '3' | '4' | '5';
export type TextSize = 'large' | 'body' | 'small' | 'xs';
export type ComponentType = 'nav-link' | 'btn' | 'card-title' | 'category-label' | 'meta' | 'post-title-large' | 'post-title-medium' | 'post-title-small';
export type LinkStyle = 'primary' | 'secondary';

/**
 * Hook for React components to get typography classes
 */
export const useTypography = (locale: string) => {
  return getTypographyClasses(locale);
}; 