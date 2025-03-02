'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PostStatus } from '@prisma/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithRelations } from '@/lib/services/post.service';
import dynamic from 'next/dynamic';

// Import the editor component dynamically with correct options
const RichTextEditor = dynamic(
  () => import('@/components/shared/RichTextEditor'),
  { 
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded-md"></div>
  }
);

type Translation = {
  locale: string;
  title: string;
  content: string;
  summary: string;
  slug: string;
  dir?: string;
  id?: string;
  postId?: string;
};

type FormData = {
  status: PostStatus;
  statusReason?: string;
  categoryId: string;
  featured: boolean;
  metaData: Record<string, any>;
  tags: string[];
  translations: Translation[];
};

interface PostFormProps {
  post?: PostWithRelations;
  isEdit?: boolean;
}

export default function PostForm({ post, isEdit = false }: PostFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category');
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    status: PostStatus.DRAFT,
    categoryId: '',
    featured: false,
    metaData: {},
    tags: [],
    translations: [
      { locale: 'en', title: '', content: '', summary: '', slug: '', dir: 'ltr' },
      { locale: 'ar', title: '', content: '', summary: '', slug: '', dir: 'rtl' }
    ]
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('en');
  const [newTag, setNewTag] = useState({ name: '', nameArabic: '' });
  const [metaFields, setMetaFields] = useState<{key: string, value: string}[]>([
    { key: 'seo_title', value: '' },
    { key: 'seo_description', value: '' },
    { key: 'seo_keywords', value: '' }
  ]);

  // Fetch categories and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch('/api/admin/categories?flat=true');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
        
        // Fetch tags
        const tagsResponse = await fetch('/api/admin/tags');
        if (!tagsResponse.ok) throw new Error('Failed to fetch tags');
        const tagsData = await tagsResponse.json();
        setAllTags(tagsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load necessary data. Please try again.');
      }
    };

    fetchData();
  }, []);

  // Initialize form data if editing
  useEffect(() => {
    if (isEdit && post) {
      // Prepare translations data ensuring both en and ar exist
      const translations = [...post.translations] as Translation[];
      
      // Check if English translation exists
      if (!translations.some(t => t.locale === 'en')) {
        translations.push({ locale: 'en', title: '', content: '', summary: '', slug: '', dir: 'ltr' });
      }
      
      // Check if Arabic translation exists
      if (!translations.some(t => t.locale === 'ar')) {
        translations.push({ locale: 'ar', title: '', content: '', summary: '', slug: '', dir: 'rtl' });
      }
      
      // Extract tags
      const postTags = post.tags?.map(t => t.tag.id) || [];
      
      // Extract metadata and ensure it's the correct type
      let metaData: Record<string, any> = {};
      if (typeof post.metaData === 'object' && post.metaData !== null) {
        metaData = post.metaData as Record<string, any>;
      }
      
      // Update metaFields with existing data
      if (Object.keys(metaData).length > 0) {
        const newMetaFields = [...metaFields];
        Object.entries(metaData).forEach(([key, value]) => {
          const existingIndex = newMetaFields.findIndex(field => field.key === key);
          if (existingIndex >= 0) {
            newMetaFields[existingIndex].value = value as string;
          } else {
            newMetaFields.push({ key, value: value as string });
          }
        });
        setMetaFields(newMetaFields);
      }
      
      setFormData({
        status: post.status,
        statusReason: post.statusReason || '',
        categoryId: post.categoryId,
        featured: post.featured,
        metaData: metaData,
        tags: postTags,
        translations
      });
    } else if (categoryId) {
      // Set category ID if provided in the query
      setFormData(prev => ({
        ...prev,
        categoryId
      }));
    }
  }, [post, isEdit, categoryId]);

  const handleChangeCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      categoryId: e.target.value
    }));
  };

  const handleChangeStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.value as PostStatus
    }));
  };

  const handleChangeFeatured = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      featured: e.target.checked
    }));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      tags: selectedOptions
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
    if (!translation || !translation.title) return;
    
    const slug = translation.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    handleTranslationChange(locale, 'slug', slug);
  };

  const handleMetaFieldChange = (index: number, field: 'key' | 'value', newValue: string) => {
    const updatedMetaFields = [...metaFields];
    updatedMetaFields[index][field] = newValue;
    setMetaFields(updatedMetaFields);
  };

  const addMetaField = () => {
    setMetaFields([...metaFields, { key: '', value: '' }]);
  };

  const removeMetaField = (index: number) => {
    const updatedMetaFields = [...metaFields];
    updatedMetaFields.splice(index, 1);
    setMetaFields(updatedMetaFields);
  };

  const handleNewTagChange = (field: 'name' | 'nameArabic', value: string) => {
    setNewTag(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const createNewTag = async () => {
    if (!newTag.name) {
      alert('Tag name is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTag)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tag');
      }
      
      const newTagData = await response.json();
      setAllTags([...allTags, newTagData]);
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTagData.id]
      }));
      setNewTag({ name: '', nameArabic: '' });
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Failed to create tag. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Filter out translations with empty titles
      const validTranslations = formData.translations.filter(t => t.title.trim() !== '');
      
      if (validTranslations.length === 0) {
        throw new Error('At least one translation with a title is required');
      }
      
      // Convert meta fields to object
      const metaData: Record<string, any> = {};
      metaFields.forEach(field => {
        if (field.key && field.value) {
          metaData[field.key] = field.value;
        }
      });
      
      // Prepare data for API
      const apiData = {
        ...formData,
        metaData,
        translations: validTranslations
      };
      
      // Determine URL and method based on whether we're editing or creating
      const url = isEdit && post 
        ? `/api/admin/posts/${post.id}`
        : '/api/admin/posts';
      
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
        throw new Error(data.error || 'Failed to save post');
      }
      
      const savedPost = await response.json();
      
      // Redirect on success
      router.push(`/admin/content?category=${savedPost.categoryId}`);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the post');
      setIsSubmitting(false);
    }
  };

  const getTranslationByLocale = (locale: string) => {
    return formData.translations.find(t => t.locale === locale) || 
      { locale, title: '', content: '', summary: '', slug: '', dir: locale === 'ar' ? 'rtl' : 'ltr' };
  };

  const currentTranslation = getTranslationByLocale(activeTab);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      
      <div className="bg-white p-6 rounded-md shadow-sm space-y-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Post Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.categoryId}
              onChange={handleChangeCategory}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.translations[0]?.name || 'Unnamed Category'}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChangeStatus}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value={PostStatus.DRAFT}>Draft</option>
              <option value={PostStatus.READY_TO_PUBLISH}>Ready to Publish</option>
              <option value={PostStatus.WAITING_APPROVAL}>Waiting Approval</option>
              <option value={PostStatus.PUBLISHED}>Published</option>
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <select
              id="tags"
              name="tags"
              multiple
              value={formData.tags}
              onChange={handleTagChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {allTags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Hold Ctrl/Cmd to select multiple tags
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="new-tag" className="block text-sm font-medium text-gray-700">
                Create New Tag
              </label>
              <button
                type="button"
                onClick={createNewTag}
                className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                id="new-tag"
                type="text"
                placeholder="Tag name (English)"
                value={newTag.name}
                onChange={(e) => handleNewTagChange('name', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <input
                type="text"
                placeholder="Tag name (Arabic)"
                value={newTag.nameArabic}
                onChange={(e) => handleNewTagChange('nameArabic', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            id="featured"
            name="featured"
            type="checkbox"
            checked={formData.featured}
            onChange={handleChangeFeatured}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
            Featured Post
          </label>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-md shadow-sm">
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
        
        {activeTab === 'en' ? (
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="title-en" className="block text-sm font-medium text-gray-700">
                Title (English) *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="title-en"
                  value={getTranslationByLocale('en').title}
                  onChange={(e) => handleTranslationChange('en', 'title', e.target.value)}
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
                Used in URLs. Click out of the title field to auto-generate.
              </p>
            </div>
            
            <div>
              <label htmlFor="summary-en" className="block text-sm font-medium text-gray-700">
                Summary (English)
              </label>
              <div className="mt-1">
                <textarea
                  id="summary-en"
                  rows={3}
                  value={getTranslationByLocale('en').summary}
                  onChange={(e) => handleTranslationChange('en', 'summary', e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Brief description of the post. Used in search results and social media previews.
              </p>
            </div>
            
            <div>
              <label htmlFor="content-en" className="block text-sm font-medium text-gray-700">
                Content (English) *
              </label>
              <div className="mt-1" key={`editor-en-${activeTab === 'en'}`}>
                <RichTextEditor
                  value={getTranslationByLocale('en').content}
                  onChange={(value) => handleTranslationChange('en', 'content', value)}
                  placeholder="Write your post content here..."
                  locale="en"
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'ar' ? (
          <div className="space-y-4 mt-4" dir="rtl">
            <div>
              <label htmlFor="title-ar" className="block text-sm font-medium text-gray-700">
                العنوان (Arabic)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="title-ar"
                  value={getTranslationByLocale('ar').title}
                  onChange={(e) => handleTranslationChange('ar', 'title', e.target.value)}
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
                يُستخدم في عناوين URL. انقر خارج حقل العنوان للإنشاء التلقائي.
              </p>
            </div>
            
            <div>
              <label htmlFor="summary-ar" className="block text-sm font-medium text-gray-700">
                ملخص (Summary)
              </label>
              <div className="mt-1">
                <textarea
                  id="summary-ar"
                  rows={3}
                  value={getTranslationByLocale('ar').summary}
                  onChange={(e) => handleTranslationChange('ar', 'summary', e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                وصف موجز للمقال. يُستخدم في نتائج البحث ومعاينات وسائل التواصل الاجتماعي.
              </p>
            </div>
            
            <div>
              <label htmlFor="content-ar" className="block text-sm font-medium text-gray-700">
                المحتوى (Content)
              </label>
              <div className="mt-1" key={`editor-ar-${activeTab === 'ar'}`}>
                <RichTextEditor
                  value={getTranslationByLocale('ar').content}
                  onChange={(value) => handleTranslationChange('ar', 'content', value)}
                  placeholder="اكتب محتوى مقالك هنا..."
                  dir="rtl"
                  locale="ar"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      <div className="bg-white p-6 rounded-md shadow-sm">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Metadata (SEO)</h3>
        
        <div className="space-y-4">
          {metaFields.map((field, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-1/3">
                <input
                  type="text"
                  placeholder="Field name"
                  value={field.key}
                  onChange={(e) => handleMetaFieldChange(index, 'key', e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Field value"
                  value={field.value}
                  onChange={(e) => handleMetaFieldChange(index, 'value', e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              {index > 2 && (
                <button
                  type="button"
                  onClick={() => removeMetaField(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addMetaField}
            className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Field
          </button>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Post' : 'Create Post'}
        </button>
      </div>
    </form>
  );
} 