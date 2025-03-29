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
  authorId: string;
  authorName?: string;
  authorNameArabic?: string;
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
    authorId: user?.id || '',
    authorName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    authorNameArabic: user ? `${user.firstNameArabic || ''} ${user.lastNameArabic || ''}`.trim() : '',
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
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
    if (post && isEdit) {
      // Extract the tags IDs
      const tags = post.tags?.map(tag => tag.tag.id) || [];
      
      // Extract metadata
      let metaData: Record<string, any> = {};
      if (post.metaData && typeof post.metaData === 'object') {
        metaData = post.metaData as Record<string, any>;
      }
      
      // Create initial meta fields from existing metadata
      const initialMetaFields = Object.entries(metaData).map(([key, value]) => ({
        key,
        value: value?.toString() || ''
      }));
      
      // If we have meta fields, use them, otherwise keep defaults
      if (initialMetaFields.length > 0) {
        setMetaFields(initialMetaFields);
      }
      
      setFormData({
        status: post.status,
        statusReason: post.statusReason || '',
        categoryId: post.categoryId,
        authorId: post.authorId,
        authorName: post.authorName || (post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : ''),
        authorNameArabic: post.authorNameArabic || (post.author ? `${post.author.firstNameArabic || ''} ${post.author.lastNameArabic || ''}`.trim() : ''),
        featured: post.featured,
        metaData,
        tags,
        translations: post.translations as Translation[]
      });
    }
    // Set initial category ID from query parameter if available
    else if (categoryId && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId }));
    }
  }, [post, isEdit, categoryId, formData.categoryId]);

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
    
    if (isSubmitting) return;
    
    // Clear previous errors
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.categoryId) {
        throw new Error('Please select a category');
      }
      
      if (formData.translations.some(t => t.locale === 'en' && !t.title)) {
        throw new Error('English title is required');
      }
      
      if (formData.translations.some(t => t.locale === 'en' && !t.content)) {
        throw new Error('English content is required');
      }
      
      // Prepare metadata from fields
      const metaData: Record<string, string> = {};
      metaFields.forEach(field => {
        if (field.key && field.value) {
          metaData[field.key] = field.value;
        }
      });
      
      // Prepare data for API
      const apiData = {
        ...formData,
        authorId: formData.authorId || user?.id,
        authorName: formData.authorName || '',
        authorNameArabic: formData.authorNameArabic || '',
        metaData
      };
      
      // Call API
      const endpoint = isEdit && post
        ? `/api/admin/posts/${post.id}`
        : '/api/admin/posts';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
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
      
      const newPost = await response.json();
      
      // Redirect to the edit page or posts list
      if (!isEdit) {
        router.push(`/admin/posts/${newPost.id}/edit?success=created`);
      } else if (post) {
        router.push(`/admin/posts/${post.id}/edit?success=updated`);
      } else {
        router.push('/admin/content?success=updated');
      }
    } catch (err: any) {
      console.error('Error saving post:', err);
      setError(err.message || 'Failed to save post');
      setIsSubmitting(false);
    }
  };

  const getTranslationByLocale = (locale: string) => {
    return formData.translations.find(t => t.locale === locale) || 
      { locale, title: '', content: '', summary: '', slug: '', dir: locale === 'ar' ? 'rtl' : 'ltr' };
  };

  const currentTranslation = getTranslationByLocale(activeTab);
  
  const handleChangeAuthorName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      authorName: e.target.value
    }));
  };

  const handleChangeAuthorNameArabic = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      authorNameArabic: e.target.value
    }));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Remove a file from the list
  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload media files
  const uploadMedia = async () => {
    if (mediaFiles.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      mediaFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // If we're editing, add the post ID
      if (isEdit && post?.id) {
        formData.append('postId', post.id);
        console.log(`Adding images to post: ${post.id}`);
      }
      
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload media');
      }
      
      const result = await response.json();
      
      // Add the new media to the existing media
      setUploadedMedia(prev => [...prev, ...result]);
      setMediaFiles([]);
      
      // Show success message
      if (result.length > 0) {
        // Add a temporary success message
        const successElement = document.createElement('div');
        successElement.className = 'bg-green-50 border-l-4 border-green-400 p-4 mb-4';
        successElement.innerHTML = `
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-green-700">Media uploaded successfully</p>
            </div>
          </div>
        `;
        
        const formElement = document.querySelector('form');
        if (formElement) {
          formElement.prepend(successElement);
          setTimeout(() => {
            successElement.remove();
          }, 3000);
        }
      }
      
    } catch (error) {
      console.error('Error uploading media:', error);
      setError('Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="category"
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
          
          {/* Author information */}
          <div className="mb-4">
            <fieldset className="border border-gray-200 rounded-md p-4">
              <legend className="text-sm font-medium text-gray-700 px-2">Author Information</legend>
              
              <div className="mb-4">
                <label htmlFor="authorName" className="block text-sm font-medium text-gray-700">
                  Author Name (English)
                </label>
                <input
                  type="text"
                  id="authorName"
                  value={formData.authorName || ''}
                  onChange={handleChangeAuthorName}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank to use your account name or enter a custom author name
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="authorNameArabic" className="block text-sm font-medium text-gray-700">
                  Author Name (Arabic)
                </label>
                <input
                  type="text"
                  id="authorNameArabic"
                  value={formData.authorNameArabic || ''}
                  onChange={handleChangeAuthorNameArabic}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  dir="rtl"
                  placeholder={user ? `${user.firstNameArabic || ''} ${user.lastNameArabic || ''}`.trim() : ''}
                />
              </div>
            </fieldset>
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
        
        {/* Featured Post */}
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={handleChangeFeatured}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
              Featured Post (will appear in featured sections)
            </label>
          </div>
        </div>

        {/* Media Upload Section */}
        <div className="mb-6 border border-gray-200 rounded-md p-4 bg-gray-50">
          <h3 className="text-lg font-medium mb-3 text-gray-800">Featured Image</h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload an image to represent this post. This image will be used in listings and social media shares.
          </p>

          {/* Display existing media if editing */}
          {isEdit && post?.media && post.media.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Current Media</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {post.media.map((item: any) => (
                  <div key={item.id} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden shadow-md hover:shadow-lg transition-all">
                      <img 
                        src={item.url} 
                        alt={item.altText || 'Post media'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button 
                        type="button"
                        className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                        onClick={() => {/* TODO: Add delete functionality */}}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File input - Styled version */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>

          {/* Selected files preview */}
          {mediaFiles.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2">Selected Images</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden shadow-md">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={file.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button 
                        type="button"
                        className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                        onClick={() => removeFile(index)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 text-xs bg-black bg-opacity-50 text-white p-1 rounded truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload button */}
          {mediaFiles.length > 0 && (
            <button
              type="button"
              onClick={uploadMedia}
              disabled={isUploading}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition-colors"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload Images'
              )}
            </button>
          )}
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