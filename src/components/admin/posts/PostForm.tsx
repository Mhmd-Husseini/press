'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PostStatus } from '@prisma/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithRelations } from '@/lib/services/post.service';
import dynamic from 'next/dynamic';
import MediaGallery from '@/components/media/MediaGallery';
import PostStatusControl from './PostStatusControl';
import { ChevronRightIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { generatePostSlug } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

// Import the TiptapEditor component dynamically with correct options
const TiptapEditor = dynamic(
  () => import('@/components/shared/TiptapEditor'),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded-md"></div>
  }
);

type Translation = {
  locale: string;
  title: string;
  content: string;
  summary: string | null;
  slug: string;
  dir?: string | null;
  id?: string;
  postId?: string;
};

type Author = {
  id: string;
  nameEn: string;
  nameAr?: string;
  country?: string;
  bio?: string;
  bioAr?: string;
  avatar?: string;
};

type FormData = {
  status: PostStatus;
  statusReason?: string;
  categoryId: string;
  authorId: string;
  postAuthorId: string;
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
  const { translateText, translateHtml, isTranslating, error: translationError } = useTranslation();
  
  const [formData, setFormData] = useState<FormData>({
    status: PostStatus.DRAFT,
    categoryId: '',
    authorId: user?.id || '',
    postAuthorId: '',
    featured: false,
    metaData: {},
    tags: [],
    translations: [
      { locale: 'ar', title: '', content: '', summary: '', slug: '', dir: 'rtl' },
      { locale: 'en', title: '', content: '', summary: '', slug: '', dir: 'ltr' }
    ]
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [authorSearch, setAuthorSearch] = useState('');
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [filteredAuthors, setFilteredAuthors] = useState<Author[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ar');
  const [newTag, setNewTag] = useState({ name: '', nameArabic: '' });
  const [metaFields, setMetaFields] = useState<{key: string, value: string}[]>([
    { key: 'seo_title', value: '' },
    { key: 'seo_description', value: '' },
    { key: 'seo_keywords', value: '' }
  ]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaMetadata, setMediaMetadata] = useState<Array<{
    title: string;
    altText: string;
    caption: string;
    captionAr: string;
  }>>([]);
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  // Add accordion state
  const [openSections, setOpenSections] = useState({
    basicInfo: true,
    content: true,
    media: true,
    metadata: false
  });

  // Toggle accordion section
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fetch categories, tags, and authors
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

        // Fetch authors
        const authorsResponse = await fetch('/api/authors');
        if (!authorsResponse.ok) throw new Error('Failed to fetch authors');
        const authorsData = await authorsResponse.json();
        setAuthors(authorsData);
        setFilteredAuthors(authorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load necessary data. Please try again.');
      }
    };

    fetchData();
  }, []);

  // Handle author search
  useEffect(() => {
    if (authorSearch.trim() === '') {
      setFilteredAuthors(authors);
    } else {
      const filtered = authors.filter(author => 
        author.nameEn.toLowerCase().includes(authorSearch.toLowerCase()) ||
        (author.nameAr && author.nameAr.includes(authorSearch)) ||
        (author.country && author.country.toLowerCase().includes(authorSearch.toLowerCase()))
      );
      setFilteredAuthors(filtered);
    }
  }, [authorSearch, authors]);

  // Handle clicking outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.author-dropdown-container')) {
        setShowAuthorDropdown(false);
      }
    };

    if (showAuthorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAuthorDropdown]);

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
      
      // Set media if post has any - extract from junction table
      if (post.media && post.media.length > 0) {
        const mediaItems = post.media.map(postMedia => postMedia.media);
        setUploadedMedia(mediaItems);
      }

      // Find the selected author if post has postAuthor
      if ((post as any).postAuthor) {
        const author = (post as any).postAuthor;
        setSelectedAuthor(author);
        setAuthorSearch(author.nameEn);
      }
      
      // Ensure all translations have slugs and order Arabic first
      const translationsWithSlugs = post.translations
        .map(translation => ({
          ...translation,
          slug: translation.slug || generatePostSlug(translation.title, translation.locale)
        }))
        .sort((a, b) => a.locale === 'ar' ? -1 : 1); // Arabic first, then English

      setFormData({
        status: post.status,
        statusReason: post.statusReason || '',
        categoryId: post.categoryId,
        authorId: post.authorId || '',
        postAuthorId: (post as any).postAuthorId || '',
        featured: post.featured,
        metaData,
        tags,
        translations: translationsWithSlugs
      });
    }
    // Set initial category ID from query parameter if available
    else if (categoryId && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId }));
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

  const handleAuthorSelect = (author: Author) => {
    setSelectedAuthor(author);
    setAuthorSearch(author.nameEn);
    setShowAuthorDropdown(false);
    setFormData(prev => ({
      ...prev,
      postAuthorId: author.id
    }));
  };

  const handleTranslationChange = (locale: string, field: keyof Translation, value: string) => {
    setFormData(prev => {
      const newTranslations = prev.translations.map(t => {
        if (t.locale === locale) {
          const updatedTranslation = { ...t, [field]: value };
          
          // Auto-generate slug when title changes
          if (field === 'title' && value.trim()) {
            updatedTranslation.slug = generatePostSlug(value, locale);
          }
          
          return updatedTranslation;
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
    
    const slug = generatePostSlug(translation.title, locale);
    handleTranslationChange(locale, 'slug', slug);
  };

  // Translation functions
  const translateField = async (sourceLocale: 'ar' | 'en', targetLocale: 'ar' | 'en', field: 'title' | 'summary' | 'content') => {
    const sourceTranslation = formData.translations.find(t => t.locale === sourceLocale);
    if (!sourceTranslation) return;

    const sourceText = sourceTranslation[field];
    if (!sourceText || typeof sourceText !== 'string' || !sourceText.trim()) return;

    try {
      let translatedText: string;
      
      if (field === 'content') {
        // For HTML content, use translateHtml
        const result = await translateHtml(sourceText, sourceLocale, targetLocale);
        translatedText = result?.translatedText || sourceText;
      } else {
        // For plain text (title, summary), use translateText
        const result = await translateText(sourceText, sourceLocale, targetLocale);
        translatedText = result?.translatedText || sourceText;
      }

      // Update the target translation
      handleTranslationChange(targetLocale, field, translatedText);
      
      // If translating title, also generate slug for the target locale
      if (field === 'title') {
        const slug = generatePostSlug(translatedText, targetLocale);
        handleTranslationChange(targetLocale, 'slug', slug);
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  const translateAllFields = async (sourceLocale: 'ar' | 'en', targetLocale: 'ar' | 'en') => {
    await Promise.all([
      translateField(sourceLocale, targetLocale, 'title'),
      translateField(sourceLocale, targetLocale, 'summary'),
      translateField(sourceLocale, targetLocale, 'content')
    ]);
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

      if (!formData.postAuthorId) {
        throw new Error('Please select an author');
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
      
      // Get media IDs from uploadedMedia
      const mediaIds = uploadedMedia.map(media => media.id);
      
      // Prepare data for API
      const apiData = {
        ...formData,
        authorId: formData.authorId || user?.id,
        metaData,
        mediaIds // Add mediaIds to the API data
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
      
      // Reset submitting state before redirect
      setIsSubmitting(false);
      
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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...newFiles]);
      
      // Initialize metadata for new files
      const newMetadata = newFiles.map(file => ({
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension for default title
        altText: file.name.replace(/\.[^/.]+$/, ''),
        caption: '',
        captionAr: ''
      }));
      setMediaMetadata(prev => [...prev, ...newMetadata]);
    }
  };

  // Clear all media files and metadata
  const clearMediaFiles = () => {
    setMediaFiles([]);
    setMediaMetadata([]);
  };

  // Remove a file from the list
  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaMetadata(prev => prev.filter((_, i) => i !== index));
  };

  // Handle metadata changes for media files
  const handleMetadataChange = (index: number, field: 'title' | 'altText' | 'caption' | 'captionAr', value: string) => {
    setMediaMetadata(prev => {
      const newMetadata = [...prev];
      newMetadata[index] = { ...newMetadata[index], [field]: value };
      return newMetadata;
    });
  };

  // Upload media files
  const uploadMedia = async () => {
    if (mediaFiles.length === 0) return;
    
    // Validate that all files have at least a title
    const missingTitles = mediaMetadata.some((meta, index) => !meta.title.trim());
    if (missingTitles) {
      setError('Please provide a title for all images before uploading.');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Add files and their metadata
      mediaFiles.forEach((file, index) => {
        formData.append('files', file);
        formData.append(`metadata[${index}][title]`, mediaMetadata[index]?.title || '');
        formData.append(`metadata[${index}][altText]`, mediaMetadata[index]?.altText || '');
        formData.append(`metadata[${index}][caption]`, mediaMetadata[index]?.caption || '');
        formData.append(`metadata[${index}][captionAr]`, mediaMetadata[index]?.captionAr || '');
      });
      
      // If we're editing, add the post ID
      if (isEdit && post?.id) {
        formData.append('postId', post.id);
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
      setMediaMetadata([]); // Clear metadata after successful upload
      
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

  // Add a function to handle media selection from gallery
  const handleMediaSelect = (media: any) => {
    setSelectedMedia(media);
    setShowMediaGallery(false);
    
    // Add selected media to uploadedMedia if not already there
    if (!uploadedMedia.some(item => item.id === media.id)) {
      setUploadedMedia(prev => [...prev, media]);
    }
  };

  // Add a function to handle removing media
  const handleRemoveMedia = async (mediaId: string) => {
    // Remove from the local state first for responsive UI
    setUploadedMedia(prev => prev.filter(media => media.id !== mediaId));
    if (selectedMedia?.id === mediaId) {
      setSelectedMedia(null);
    }
    
    if (isEdit && post?.id) {
      try {
        // Call API to disconnect media from post if editing
        const response = await fetch(`/api/admin/posts/${post.id}/media/${mediaId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          console.error('Failed to remove media from post');
        }
      } catch (error) {
        console.error('Error removing media from post:', error);
      }
    }
  };

  // Handle metadata changes for existing media
  const handleExistingMediaMetadataChange = async (mediaId: string, field: 'title' | 'altText' | 'caption' | 'captionAr', value: string) => {
    // Update local state first for responsive UI
    setUploadedMedia(prev => prev.map(media => 
      media.id === mediaId 
        ? { ...media, [field]: value }
        : media
    ));

    // Update in database
    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        console.error('Failed to update media metadata');
      }
    } catch (error) {
      console.error('Error updating media metadata:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md">
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

      {translationError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Translation Error: {translationError}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Basic Info Section */}
      <div className="bg-white p-4 rounded-md shadow border border-gray-200">
        <button 
          type="button"
          className="flex justify-between items-center w-full text-left px-2 py-3"
          onClick={() => toggleSection('basicInfo')}
        >
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          {openSections.basicInfo ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {openSections.basicInfo && (
          <div className="mt-4 space-y-6 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  الفئة * / Category *
                </label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={handleChangeCategory}
                  className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  required
                >
                  <option value="">اختر فئة / Select a category</option>
                  {categories.map(category => {
                    const arabicName = category.translations?.find((t: any) => t.locale === 'ar')?.name;
                    const englishName = category.translations?.find((t: any) => t.locale === 'en')?.name || category.translations[0]?.name;
                    const displayName = arabicName && englishName 
                      ? `${arabicName} / ${englishName}`
                      : arabicName || englishName || 'Unnamed Category';
                    
                    return (
                      <option key={category.id} value={category.id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Author Selection */}
              <div className="mb-4">
                <label htmlFor="authorSearch" className="block text-sm font-medium text-gray-700 mb-1">
                  المؤلف * / Author *
                </label>
                <div className="relative author-dropdown-container">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="authorSearch"
                    value={authorSearch}
                    onChange={(e) => {
                      setAuthorSearch(e.target.value);
                      setShowAuthorDropdown(true);
                    }}
                    onFocus={() => setShowAuthorDropdown(true)}
                    className="block w-full pl-10 px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    placeholder="Search authors by name or country..."
                    required
                  />
                </div>
                
                {/* Author dropdown */}
                {showAuthorDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredAuthors.length > 0 ? (
                      filteredAuthors.map((author) => (
                        <div
                          key={author.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleAuthorSelect(author)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{author.nameEn}</div>
                              {author.nameAr && (
                                <div className="text-sm text-gray-600 mt-1" dir="rtl">{author.nameAr}</div>
                              )}
                              {author.country && (
                                <div className="text-xs text-gray-500 mt-1">📍 {author.country}</div>
                              )}
                            </div>
                            {author.avatar && (
                              <img 
                                src={author.avatar} 
                                alt={author.nameEn}
                                className="w-8 h-8 rounded-full ml-3"
                              />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        No authors found matching your search.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected author display */}
                {selectedAuthor && (
                  <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {selectedAuthor.avatar && (
                          <img 
                            src={selectedAuthor.avatar} 
                            alt={selectedAuthor.nameEn}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{selectedAuthor.nameEn}</div>
                          {selectedAuthor.nameAr && (
                            <div className="text-sm text-gray-600" dir="rtl">{selectedAuthor.nameAr}</div>
                          )}
                          {selectedAuthor.country && (
                            <div className="text-xs text-gray-500">📍 {selectedAuthor.country}</div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAuthor(null);
                          setAuthorSearch('');
                          setFormData(prev => ({ ...prev, postAuthorId: '' }));
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

              {/* Status Control */}
              <div className="mb-4">
                <PostStatusControl
                  value={formData.status}
                  onChange={handleChangeStatus}
                  authorId={formData.authorId}
                  isEdit={isEdit}
                />
              </div>
            </div>
            
            {/* Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  العلامات / Tags
                </label>
                <select
                  id="tags"
                  name="tags"
                  multiple
                  value={formData.tags}
                  onChange={handleTagChange}
                  className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white min-h-[100px]"
                >
                  {allTags.map(tag => {
                    const arabicName = tag.nameArabic;
                    const englishName = tag.name;
                    const displayName = arabicName && englishName 
                      ? `${arabicName} / ${englishName}`
                      : arabicName || englishName || 'Unnamed Tag';
                    
                    return (
                      <option key={tag.id} value={tag.id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  اضغط Ctrl/Cmd لاختيار علامات متعددة / Hold Ctrl/Cmd to select multiple tags
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="new-tag" className="block text-sm font-medium text-gray-700">
                    إنشاء علامة جديدة / Create New Tag
                  </label>
                  <button
                    type="button"
                    onClick={createNewTag}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    إضافة / Add
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="new-tag"
                    type="text"
                    placeholder="اسم العلامة (إنجليزي) / Tag name (English)"
                    value={newTag.name}
                    onChange={(e) => handleNewTagChange('name', e.target.value)}
                    className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="اسم العلامة (عربي) / Tag name (Arabic)"
                    value={newTag.nameArabic}
                    onChange={(e) => handleNewTagChange('nameArabic', e.target.value)}
                    className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
                  className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                  Featured Post (will appear in featured sections)
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="bg-white p-4 rounded-md shadow border border-gray-200">
        <button 
          type="button"
          className="flex justify-between items-center w-full text-left px-2 py-3"
          onClick={() => toggleSection('content')}
        >
          <h3 className="text-lg font-medium text-gray-900">Content</h3>
          {openSections.content ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {openSections.content && (
          <div className="mt-4 space-y-6 border-t border-gray-200 pt-4">
            {/* Content Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex">
                  {/* Show Arabic first, then English */}
                  {formData.translations.map(translation => (
                    <button
                      key={translation.locale}
                      type="button"
                      onClick={() => setActiveTab(translation.locale)}
                      className={`${
                        activeTab === translation.locale
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } px-4 py-2 text-sm font-medium border-b-2`}
                    >
                      {translation.locale === 'en' ? 'English' : 'العربية (Primary)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Translation Panels */}
            {formData.translations.map(translation => (
              <div
                key={translation.locale}
                className={`transition-opacity duration-200 ${
                  activeTab === translation.locale ? 'block' : 'hidden'
                }`}
                dir={translation.dir || undefined}
              >
                <div className="mb-4">
                  <label htmlFor={`title-${translation.locale}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {translation.locale === 'ar' ? 'العنوان' : 'Title'} {translation.locale === 'ar' ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    id={`title-${translation.locale}`}
                    value={translation.title}
                    onChange={(e) => handleTranslationChange(translation.locale, 'title', e.target.value)}
                    className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    required={translation.locale === 'ar'}
                    dir={translation.dir || undefined}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor={`slug-${translation.locale}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {translation.locale === 'ar' ? 'الرابط' : 'Slug'} {translation.locale === 'ar' ? '*' : ''} ({translation.locale === 'ar' ? 'يتم إنشاؤه تلقائياً' : 'Auto-generated'})
                  </label>
                  <input
                    type="text"
                    id={`slug-${translation.locale}`}
                    value={translation.slug}
                    readOnly
                    className="block w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed"
                    required={translation.locale === 'ar'}
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {translation.locale === 'ar' 
                      ? 'يتم إنشاء الرابط تلقائياً من العنوان والتاريخ.'
                      : 'Slug is automatically generated from title and date.'
                    }
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor={`summary-${translation.locale}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {translation.locale === 'ar' ? 'الملخص' : 'Summary'}
                  </label>
                  <textarea
                    id={`summary-${translation.locale}`}
                    value={translation.summary || ''}
                    onChange={(e) => handleTranslationChange(translation.locale, 'summary', e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    dir={translation.dir || undefined}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor={`content-${translation.locale}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {translation.locale === 'ar' ? 'المحتوى' : 'Content'} {translation.locale === 'ar' ? '*' : ''}
                  </label>
            <TiptapEditor
              value={translation.content}
              onChange={(value: string) => handleTranslationChange(translation.locale, 'content', value)}
              placeholder={translation.locale === 'ar' ? 'اكتب محتوى المنشور هنا...' : 'Write your post content here...'}
              locale={translation.locale}
              dir={(translation.dir as 'ltr' | 'rtl') || 'ltr'}
            />
                </div>
                
                {/* Translation Button for this section */}
                <div className="mb-4 flex justify-end">
                  {translation.locale === 'ar' ? (
                    <button
                      type="button"
                      onClick={() => translateAllFields('ar', 'en')}
                      disabled={isTranslating}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Translate all Arabic content to English"
                    >
                      {isTranslating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Translating...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          Translate to English
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => translateAllFields('en', 'ar')}
                      disabled={isTranslating}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Translate all English content to Arabic"
                    >
                      {isTranslating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Translating...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          Translate to Arabic
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Media Section */}
      <div className="bg-white p-4 rounded-md shadow border border-gray-200">
        <button 
          type="button"
          className="flex justify-between items-center w-full text-left px-2 py-3"
          onClick={() => toggleSection('media')}
        >
          <h3 className="text-lg font-medium text-gray-900">Featured Image</h3>
          {openSections.media ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {openSections.media && (
          <div className="mt-4 space-y-6 border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-4">
              Upload an image to represent this post. This image will be used in listings and social media shares. 
              You can provide a title, alt text for accessibility, and an optional caption for each image.
            </p>

            {/* Display existing and selected media */}
            {(uploadedMedia.length > 0 || selectedMedia) && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Selected Media</h4>
                <div className="space-y-4">
                  {uploadedMedia.map((item: any) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-start space-x-4">
                        {/* Image preview */}
                        <div className="relative group flex-shrink-0">
                          <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden shadow-md">
                            <img 
                              src={item.url} 
                              alt={item.altText || 'Media item'} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Always visible remove button */}
                          <button 
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors shadow-md"
                            onClick={() => handleRemoveMedia(item.id)}
                            title="Remove image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Editable metadata */}
                        <div className="flex-1 space-y-3">
                          {/* Remove button in metadata section */}
                          <div className="flex justify-end">
                            <button 
                              type="button"
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              onClick={() => handleRemoveMedia(item.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove Image
                            </button>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => handleExistingMediaMetadataChange(item.id, 'title', e.target.value)}
                              className="block w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              placeholder="Media title"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Alt Text
                            </label>
                            <input
                              type="text"
                              value={item.altText || ''}
                              onChange={(e) => handleExistingMediaMetadataChange(item.id, 'altText', e.target.value)}
                              className="block w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              placeholder="Alternative text for accessibility"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Caption (English)
                            </label>
                            <textarea
                              value={item.caption || ''}
                              onChange={(e) => handleExistingMediaMetadataChange(item.id, 'caption', e.target.value)}
                              rows={2}
                              className="block w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              placeholder="English caption (optional)"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Caption (Arabic)
                            </label>
                            <textarea
                              value={item.captionAr || ''}
                              onChange={(e) => handleExistingMediaMetadataChange(item.id, 'captionAr', e.target.value)}
                              rows={2}
                              className="block w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              placeholder="Arabic caption (optional)"
                              dir="rtl"
                            />
                          </div>
                        </div>
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
                    <button
                      type="button"
                      onClick={() => setShowMediaGallery(true)}
                      className="pl-1 text-indigo-600 hover:text-indigo-500"
                    >
                      or choose from gallery
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Selected files preview with metadata inputs */}
            {mediaFiles.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2">Files to Upload</h4>
                <div className="space-y-4">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start space-x-4">
                        {/* Image preview */}
                        <div className="relative group flex-shrink-0">
                          <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden shadow-md">
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
                        </div>
                        
                        {/* Metadata inputs */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={mediaMetadata[index]?.title || ''}
                              onChange={(e) => handleMetadataChange(index, 'title', e.target.value)}
                              className="block w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              placeholder="Image title"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Alt Text
                            </label>
                            <input
                              type="text"
                              value={mediaMetadata[index]?.altText || ''}
                              onChange={(e) => handleMetadataChange(index, 'altText', e.target.value)}
                              className="block w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              placeholder="Alternative text for accessibility"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Caption (English)
                            </label>
                            <textarea
                              value={mediaMetadata[index]?.caption || ''}
                              onChange={(e) => handleMetadataChange(index, 'caption', e.target.value)}
                              rows={2}
                              className="block w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              placeholder="English caption (optional)"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Caption (Arabic)
                            </label>
                            <textarea
                              value={mediaMetadata[index]?.captionAr || ''}
                              onChange={(e) => handleMetadataChange(index, 'captionAr', e.target.value)}
                              rows={2}
                              className="block w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              placeholder="Arabic caption (optional)"
                              dir="rtl"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        File: {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload and Clear buttons */}
            {mediaFiles.length > 0 && (
              <div className="mt-3 flex space-x-3">
                <button
                  type="button"
                  onClick={uploadMedia}
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition-colors"
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
                
                <button
                  type="button"
                  onClick={clearMediaFiles}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Metadata Section */}
      <div className="bg-white p-4 rounded-md shadow border border-gray-200">
        <button 
          type="button"
          className="flex justify-between items-center w-full text-left px-2 py-3"
          onClick={() => toggleSection('metadata')}
        >
          <h3 className="text-lg font-medium text-gray-900">SEO & Metadata</h3>
          {openSections.metadata ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {openSections.metadata && (
          <div className="mt-4 space-y-6 border-t border-gray-200 pt-4">
            <div className="space-y-3">
              {metaFields.map((field, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => handleMetaFieldChange(index, 'key', e.target.value)}
                      placeholder="Meta key"
                      className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleMetaFieldChange(index, 'value', e.target.value)}
                      placeholder="Meta value"
                      className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeMetaField(index)}
                      className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addMetaField}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Metadata Field
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Post' : 'Create Post'}
        </button>
      </div>

      {/* Media Gallery */}
      <MediaGallery
        isOpen={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
        onSelect={handleMediaSelect}
        selectedId={selectedMedia?.id}
      />
    </form>
  );
} 