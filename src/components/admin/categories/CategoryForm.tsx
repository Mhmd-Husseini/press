'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryWithTranslations } from '@/lib/services/category.service';

// Client-only component to safely use useSearchParams
function CategoryFormContent({ category, isEdit = false }: CategoryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parent');
  
  const [formData, setFormData] = useState<FormData>({
    parentId: null,
    order: 0,
    translations: [
      { locale: 'en', name: '', description: '', slug: '', dir: 'ltr' },
      { locale: 'ar', name: '', description: '', slug: '', dir: 'rtl' }
    ]
  });
  
  const [parents, setParents] = useState<CategoryWithTranslations[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('en');

  // Fetch available parent categories
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const response = await fetch(`/api/admin/categories?flat=true`);
        if (!response.ok) throw new Error('Failed to fetch parent categories');
        const data = await response.json();
        
        // If we're editing, filter out the current category and its children
        if (isEdit && category) {
          const filtered = data.filter((c: CategoryWithTranslations) => 
            c.id !== category.id && 
            (!c.parentId || c.parentId !== category.id)
          );
          setParents(filtered);
        } else {
          setParents(data);
        }
      } catch (error) {
        console.error('Error fetching parent categories:', error);
      }
    };

    fetchParents();
  }, [category, isEdit]);

  // Initialize form data if editing
  useEffect(() => {
    if (isEdit && category) {
      // Prepare translations data ensuring both en and ar exist
      const translations = [...category.translations];
      
      // Check if English translation exists
      if (!translations.some(t => t.locale === 'en')) {
        translations.push({ 
          id: `temp-${Date.now()}-en`,
          locale: 'en', 
          name: '', 
          description: '', 
          slug: '', 
          dir: 'ltr',
          categoryId: category.id
        });
      }
      
      // Check if Arabic translation exists
      if (!translations.some(t => t.locale === 'ar')) {
        translations.push({ 
          id: `temp-${Date.now()}-ar`, 
          locale: 'ar', 
          name: '', 
          description: '', 
          slug: '', 
          dir: 'rtl',
          categoryId: category.id
        });
      }
      
      setFormData({
        parentId: category.parentId,
        order: category.order || 0,
        translations
      });
    } else if (parentId) {
      // Set parent ID if provided in the query
      setFormData(prev => ({
        ...prev,
        parentId
      }));
    }
  }, [category, isEdit, parentId]);

  const handleChangeParent = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "none" ? null : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      parentId: value
    }));
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    
    setFormData(prev => ({
      ...prev,
      order: value
    }));
  };

  const handleTranslationChange = (locale: string, field: keyof Translation, value: string) => {
    setFormData(prev => {
      const newTranslations = prev.translations.map(t => {
        if (t.locale === locale) {
          return { ...t, [field]: value };
        }
        return t;
      });
      
      return {
        ...prev,
        translations: newTranslations
      };
    });
  };

  const generateSlug = (locale: string) => {
    const translation = formData.translations.find(t => t.locale === locale);
    if (!translation || !translation.name) return;
    
    const slug = translation.name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    handleTranslationChange(locale, 'slug', slug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Filter out translations with empty names
      const validTranslations = formData.translations.filter(t => t.name.trim() !== '');
      
      if (validTranslations.length === 0) {
        throw new Error('At least one translation with a name is required');
      }
      
      // Prepare data for API
      const apiData = {
        ...formData,
        translations: validTranslations
      };
      
      // Determine URL and method based on whether we're editing or creating
      const url = isEdit && category 
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      // Send request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save category');
      }
      
      // Redirect on success
      router.push('/admin/categories');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the category');
      setIsSubmitting(false);
    }
  };

  const getTranslationByLocale = (locale: string) => {
    return formData.translations.find(t => t.locale === locale) || 
      { locale, name: '', description: '', slug: '', dir: locale === 'ar' ? 'rtl' : 'ltr' };
  };

  const currentTranslation = getTranslationByLocale(activeTab);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-md shadow-sm">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="parent" className="block text-sm font-medium text-gray-700">
          Parent Category
        </label>
        <select
          id="parent"
          name="parent"
          value={formData.parentId || "none"}
          onChange={handleChangeParent}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="none">None (Top Level)</option>
          {parents.map(parent => (
            <option key={parent.id} value={parent.id}>
              {parent.translations[0]?.name || 'Unnamed Category'}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="order" className="block text-sm font-medium text-gray-700">
          Order (for header display)
        </label>
        <input
          type="number"
          id="order"
          name="order"
          value={formData.order}
          onChange={handleOrderChange}
          min="0"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="0"
        />
        <p className="mt-1 text-sm text-gray-500">
          Lower numbers appear first in the header. Subcategories ignore this order.
        </p>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4" aria-label="Translations">
          <button
            type="button"
            onClick={() => setActiveTab('en')}
            className={`${
              activeTab === 'en'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ar')}
            className={`${
              activeTab === 'ar'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm`}
          >
            العربية (Arabic)
          </button>
        </nav>
      </div>
      
      <div className={activeTab === 'en' ? '' : 'hidden'}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name-en" className="block text-sm font-medium text-gray-700">
              Name (English) *
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="name-en"
                value={getTranslationByLocale('en').name}
                onChange={(e) => handleTranslationChange('en', 'name', e.target.value)}
                onBlur={() => generateSlug('en')}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="slug-en" className="block text-sm font-medium text-gray-700">
              Slug (English) *
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="slug-en"
                value={getTranslationByLocale('en').slug}
                onChange={(e) => handleTranslationChange('en', 'slug', e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Used in URLs. Click out of the name field to auto-generate.
            </p>
          </div>
          
          <div>
            <label htmlFor="description-en" className="block text-sm font-medium text-gray-700">
              Description (English)
            </label>
            <div className="mt-1">
              <textarea
                id="description-en"
                rows={3}
                value={getTranslationByLocale('en').description || ''}
                onChange={(e) => handleTranslationChange('en', 'description', e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className={activeTab === 'ar' ? '' : 'hidden'} dir="rtl">
        <div className="space-y-4">
          <div>
            <label htmlFor="name-ar" className="block text-sm font-medium text-gray-700">
              الاسم (Arabic)
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="name-ar"
                value={getTranslationByLocale('ar').name}
                onChange={(e) => handleTranslationChange('ar', 'name', e.target.value)}
                onBlur={() => generateSlug('ar')}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="slug-ar" className="block text-sm font-medium text-gray-700">
              الرابط (Slug)
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="slug-ar"
                value={getTranslationByLocale('ar').slug}
                onChange={(e) => handleTranslationChange('ar', 'slug', e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              يستخدم في عناوين URL. انقر خارج حقل الاسم للإنشاء التلقائي.
            </p>
          </div>
          
          <div>
            <label htmlFor="description-ar" className="block text-sm font-medium text-gray-700">
              الوصف (Description)
            </label>
            <div className="mt-1">
              <textarea
                id="description-ar"
                rows={3}
                value={getTranslationByLocale('ar').description || ''}
                onChange={(e) => handleTranslationChange('ar', 'description', e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end" dir="ltr">
        <button
          type="button"
          onClick={() => router.push('/admin/categories')}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}

type Translation = {
  id?: string;
  categoryId?: string;
  locale: string;
  name: string;
  description: string | null;
  slug: string;
  dir?: string | null;
};

type FormData = {
  parentId: string | null;
  order: number;
  translations: Translation[];
};

interface CategoryFormProps {
  category?: CategoryWithTranslations;
  isEdit?: boolean;
}

// Main component that will be imported by other components
export default function CategoryForm(props: CategoryFormProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return <div>Loading form...</div>;
  }
  
  return <CategoryFormContent {...props} />;
} 