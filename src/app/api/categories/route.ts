import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get locale parameter from query if present
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    
    // Fetch only top-level categories (those without a parent) with translations and children
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null, // Only get active (non-deleted) categories
        parentId: null, // Only get top-level categories (no parent)
      },
      include: {
        translations: true,
        children: {
          where: {
            deletedAt: null // Only get active children
          },
          include: {
            translations: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Format response with proper locale support
    const formattedCategories = categories.map(category => {
      // Get translation for the requested locale, fallback to first translation
      const translation = category.translations.find(t => t.locale === locale) || 
                         category.translations[0];
      
      if (!translation) {
        return null; // Skip if no translation available
      }
      
      // Format children categories
      const formattedChildren = category.children.map(child => {
        const childTranslation = child.translations.find(t => t.locale === locale) || 
                                child.translations[0];
        
        if (!childTranslation) return null;
        
        return {
          id: child.id,
          slug: childTranslation.slug,
          name: {
            en: child.translations.find(t => t.locale === 'en')?.name || childTranslation.name,
            ar: child.translations.find(t => t.locale === 'ar')?.name || childTranslation.name
          },
          description: childTranslation.description || null,
          locale: childTranslation.locale,
          dir: childTranslation.dir || 'ltr'
        };
      }).filter(Boolean); // Remove null entries
      
      return {
        id: category.id,
        slug: translation.slug,
        name: {
          en: category.translations.find(t => t.locale === 'en')?.name || translation.name,
          ar: category.translations.find(t => t.locale === 'ar')?.name || translation.name
        },
        description: translation.description || null,
        locale: translation.locale,
        dir: translation.dir || 'ltr',
        children: formattedChildren
      };
    }).filter(Boolean); // Remove null entries

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    // Fix error handling to avoid TypeError
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error fetching categories:', errorMessage);
    
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
} 