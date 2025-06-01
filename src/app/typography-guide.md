# Typography Guide - Phoenix Press

This guide outlines the consistent typography system used across the Phoenix Press application.

## Font Hierarchy

### Base Fonts
- **English**: Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
- **Arabic**: Cairo, Tajawal, Amiri, Noto Sans Arabic, Arial, sans-serif

### Base Sizes
- **English**: 16px base, 18px tablet+, 18px desktop
- **Arabic**: 18px base, 20px tablet+, 20px desktop

## Heading Classes

### Hero/Main Headings
```css
.heading-hero        /* 36px → 48px → 60px */
.ar-heading-hero     /* 30px → 36px → 48px */
```
**Usage**: Landing page heroes, main banners

### H1 - Page Titles
```css
.heading-1           /* 30px → 36px */
.ar-heading-1        /* 24px → 30px */
```
**Usage**: Page titles, article headlines

### H2 - Section Headings
```css
.heading-2           /* 24px → 30px */
.ar-heading-2        /* 20px → 24px */
```
**Usage**: Section headers, category headings

### H3 - Subsection Headings
```css
.heading-3           /* 20px → 24px */
.ar-heading-3        /* 18px → 20px */
```
**Usage**: Subsection titles, widget headers

### H4 - Component Headings
```css
.heading-4           /* 18px → 20px */
.ar-heading-4        /* 16px → 18px */
```
**Usage**: Category names, card headers, component titles

### H5 - Small Headings
```css
.heading-5           /* 16px → 18px */
.ar-heading-5        /* 14px → 16px */
```
**Usage**: Small section headers, form labels

## Body Text Classes

### Large Text
```css
.text-large          /* 18px → 20px */
.ar-text-large       /* 16px → 18px */
```
**Usage**: Introductory paragraphs, important content

### Standard Body Text
```css
.text-body           /* 16px → 18px */
.ar-text-body        /* 14px → 16px */
```
**Usage**: Article content, descriptions

### Small Text
```css
.text-small          /* 14px → 16px */
.ar-text-small       /* 12px → 14px */
```
**Usage**: Captions, secondary information

### Extra Small Text
```css
.text-xs-custom      /* 12px → 14px */
.ar-text-xs-custom   /* 12px */
```
**Usage**: Fine print, disclaimers

## Component-Specific Classes

### Navigation
```css
.nav-link            /* 16px → 18px */
.ar-nav-link         /* 14px → 16px */
```

### Buttons
```css
.btn-text            /* 14px → 16px */
.ar-btn-text         /* 12px → 14px */
```

### Cards
```css
.card-title          /* 18px → 20px */
.ar-card-title       /* 16px → 18px */
```

### Post/Article Titles
```css
.post-title-large    /* 24px → 30px */
.ar-post-title-large /* 20px → 24px */

.post-title-medium   /* 20px → 24px */
.ar-post-title-medium /* 18px → 20px */

.post-title-small    /* 18px → 20px */
.ar-post-title-small /* 16px → 18px */
```

### Category Labels
```css
.category-label      /* 14px → 16px + uppercase */
.ar-category-label   /* 12px → 14px */
```

### Metadata & Timestamps
```css
.meta-text           /* 12px → 14px + gray-600 */
.ar-meta-text        /* 12px + gray-600 */
```

### Links
```css
.link-primary        /* 16px → 18px + blue colors */
.ar-link-primary     /* 14px → 16px + blue colors */

.link-secondary      /* 14px → 16px + gray colors */
.ar-link-secondary   /* 12px → 14px + gray colors */
```

## Usage Examples

### Page Structure
```jsx
// Main page title
<h1 className={isRTL ? 'ar-heading-1' : 'heading-1'}>Page Title</h1>

// Section headers
<h2 className={isRTL ? 'ar-heading-2' : 'heading-2'}>Section Title</h2>

// Component headers
<h3 className={isRTL ? 'ar-heading-4' : 'heading-4'}>Component Title</h3>
```

### Content Areas
```jsx
// Article content
<p className={isRTL ? 'ar-text-body' : 'text-body'}>Article content...</p>

// Metadata
<span className={isRTL ? 'ar-meta-text' : 'meta-text'}>Published date</span>

// Links
<a className={isRTL ? 'ar-link-primary' : 'link-primary'}>Read more</a>
```

### Cards & Components
```jsx
// Card title
<h3 className={isRTL ? 'ar-card-title' : 'card-title'}>Card Title</h3>

// Post title
<h2 className={isRTL ? 'ar-post-title-medium' : 'post-title-medium'}>
  Post Title
</h2>
```

## Best Practices

1. **Always use conditional classes** for RTL support
2. **Maintain hierarchy** - don't skip heading levels
3. **Use semantic HTML** - match class to HTML element purpose
4. **Test on multiple devices** - responsive scaling is built-in
5. **Consistent spacing** - let line-height handle vertical rhythm

## Responsive Behavior

All typography scales automatically:
- **Mobile**: Base sizes
- **Tablet (768px+)**: Slightly larger
- **Desktop (1024px+)**: Optimized for reading

## Color Guidelines

Typography classes handle sizing and fonts only. Apply colors separately:

```jsx
// Good
<h1 className={`${isRTL ? 'ar-heading-1' : 'heading-1'} text-gray-900`}>

// Bad (if class included color)
<h1 className="heading-1-dark">
```

This approach maintains flexibility and follows Tailwind CSS principles. 