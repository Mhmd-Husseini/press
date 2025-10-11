'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable, Column } from '@/components/shared/data-table';
import PageHeader from '@/components/admin/PageHeader';
import { PostStatus } from '@prisma/client';
import { formatDate, truncateText } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface Category {
  id: string;
  translations: { locale: string; name: string }[];
}

interface PostTranslation {
  locale: string;
  title: string;
  slug?: string;
}

interface Post {
  id: string;
  status: PostStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  authorNameArabic?: string;
  category: {
    id: string;
    translations: { locale: string; name: string }[];
  };
  author: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    firstNameArabic?: string;
    lastNameArabic?: string;
  };
  updatedBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    firstNameArabic?: string;
    lastNameArabic?: string;
  };
  translations: PostTranslation[];
}

interface PostsResponse {
  posts: Post[];
  total: number;
  pages: number;
  page?: number;
  limit?: number;
}

export default function ContentPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'ar' | 'en'>('en');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Get current parameters from URL
  const selectedCategoryId = searchParams.get('category');
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentLimit = parseInt(searchParams.get('limit') || '10');
  const currentSearch = searchParams.get('search') || '';

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories?flat=true');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch posts based on current parameters
  const fetchPosts = async () => {
    setLoading(true);
    setPosts([]);
    
    try {
      let url = '/api/admin/posts';
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
        ...(selectedCategoryId && { categoryId: selectedCategoryId }),
        ...(currentSearch && { search: currentSearch })
      });
      
      url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const data: PostsResponse = await response.json();
      setPosts(data.posts || []);
      setPagination({
        page: data.page || currentPage,
        limit: data.limit || currentLimit,
        total: data.total || 0,
        pages: data.pages || 0
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts when parameters change
  useEffect(() => {
    fetchPosts();
  }, [selectedCategoryId, currentPage, currentLimit, currentSearch]);

  const handleCategoryChange = (categoryId?: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    params.set('page', '1'); // Reset to first page
    router.push(`/admin/content?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/admin/content?${params.toString()}`);
  };

  const handleLimitChange = (limit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', limit.toString());
    params.set('page', '1'); // Reset to first page
    router.push(`/admin/content?${params.toString()}`);
  };

  const handleSearch = (search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset to first page
    router.push(`/admin/content?${params.toString()}`);
  };


  const getPostTitle = (post: Post) => {
    // Look for current language translation first, then English, then first available
    const currentTranslation = post.translations.find(t => t.locale === currentLanguage);
    const enTranslation = post.translations.find(t => t.locale === 'en');
    const firstTranslation = post.translations[0];
    
    return currentTranslation?.title || enTranslation?.title || firstTranslation?.title || 'Untitled Post';
  };

  const getPostSlug = (post: Post) => {
    // Look for current language translation first, then English, then first available
    const currentTranslation = post.translations.find(t => t.locale === currentLanguage);
    const enTranslation = post.translations.find(t => t.locale === 'en');
    const firstTranslation = post.translations[0];
    
    return currentTranslation?.slug || enTranslation?.slug || firstTranslation?.slug || post.id;
  };

  const getCategoryName = (category: Category): string => {
    const currentTranslation = category.translations.find(t => t.locale === currentLanguage);
    const enTranslation = category.translations.find(t => t.locale === 'en');
    const firstTranslation = category.translations[0];
    
    return currentTranslation?.name || enTranslation?.name || firstTranslation?.name || 'Unnamed Category';
  };

  const getLocalizedText = (ar: string, en: string): string => {
    return currentLanguage === 'ar' ? ar : en;
  };

  const getStatusClass = (status: PostStatus) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-purple-100 text-purple-800';
      case 'DECLINED': return 'bg-red-100 text-red-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: PostStatus) => {
    switch (status) {
      case 'PUBLISHED': return getLocalizedText('منشور', 'Published');
      case 'DRAFT': return getLocalizedText('مسودة', 'Draft');
      case 'PENDING_REVIEW': return getLocalizedText('في انتظار المراجعة', 'Pending Review');
      case 'UNDER_REVIEW': return getLocalizedText('قيد المراجعة', 'Under Review');
      case 'APPROVED': return getLocalizedText('موافق عليه', 'Approved');
      case 'DECLINED': return getLocalizedText('مرفوض', 'Declined');
      case 'ARCHIVED': return getLocalizedText('مؤرشف', 'Archived');
      default: return status;
    }
  };

  const getAuthorName = (post: Post) => {
    // Check for authorName property first (for backward compatibility)
    if (post.authorName) return post.authorName;
    
    // Then check for author object
    if (!post.author) return 'Unknown';
    
    // If name property exists (for backwards compatibility)
    if ('name' in post.author && typeof post.author.name === 'string' && post.author.name) {
      return post.author.name;
    }
    
    // Otherwise construct from firstName and lastName
    const firstName = post.author.firstName || '';
    const lastName = post.author.lastName || '';
    
    if (!firstName && !lastName) return 'Unknown';
    return `${firstName} ${lastName}`.trim();
  };

  const getUpdatedByName = (post: Post) => {
    // Check for updatedBy object
    if (!post.updatedBy) return null;
    
    // Construct from firstName and lastName
    const firstName = post.updatedBy.firstName || '';
    const lastName = post.updatedBy.lastName || '';
    
    if (!firstName && !lastName) return post.updatedBy.email;
    return `${firstName} ${lastName}`.trim();
  };

  // Define table columns
  const columns: Column<Post>[] = [
    {
      key: 'translations',
      label: getLocalizedText('العنوان', 'Title'),
      sortable: true,
      render: (_, post) => (
        <div className={`text-sm text-gray-900 leading-relaxed whitespace-normal ${
          currentLanguage === 'ar' ? 'text-right' : 'text-left'
        }`}>
          {getPostTitle(post)}
        </div>
      ),
    },
    {
      key: 'status',
      label: getLocalizedText('الحالة', 'Status'),
      render: (status, post) => (
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(status as PostStatus)}`}>
            {getStatusLabel(status as PostStatus)}
          </span>
          {post.featured && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {getLocalizedText('مميز', 'Featured')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: getLocalizedText('الفئة', 'Category'),
      render: (_, post) => (
        <span className={`text-sm text-gray-500 ${
          currentLanguage === 'ar' ? 'text-right' : 'text-left'
        }`}>
          {post.category ? getCategoryName(post.category) : getLocalizedText('غير مصنف', 'Uncategorized')}
        </span>
      ),
    },
    {
      key: 'author',
      label: getLocalizedText('المؤلف', 'Author'),
      render: (_, post) => (
        <span className={`text-sm text-gray-500 ${
          currentLanguage === 'ar' ? 'text-right' : 'text-left'
        }`}>
          {getAuthorName(post)}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: getLocalizedText('آخر تحديث', 'Last Updated'),
      sortable: true,
      render: (updatedAt, post) => {
        const updatedByName = getUpdatedByName(post);
        return (
          <div className={`text-sm text-gray-500 ${currentLanguage === 'ar' ? 'text-right' : 'text-left'}`}>
            <div>{formatDate(updatedAt as string)}</div>
            {updatedByName && (
              <div className="text-xs text-gray-400 mt-0.5">
                {getLocalizedText('بواسطة', 'by')} {updatedByName}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'id',
      label: getLocalizedText('الإجراءات', 'Actions'),
      className: currentLanguage === 'ar' ? 'text-left' : 'text-right',
      render: (_, post) => (
        <div className={`flex gap-2 ${currentLanguage === 'ar' ? 'justify-start' : 'justify-end'}`}>
          <Link
            href={`/admin/posts/${post.id}/edit`}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            {getLocalizedText('تعديل', 'Edit')}
          </Link>
          <Link
            href={`/posts/${encodeURIComponent(getPostSlug(post))}`}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            target="_blank"
          >
            {getLocalizedText('عرض', 'View')}
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className={`py-6 space-y-6 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`} dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <PageHeader 
        title={getLocalizedText('إدارة المحتوى', 'Content Management')} 
        description={getLocalizedText('إدارة جميع منشوراتك ومقالاتك', 'Manage all your posts and articles')}
        actions={[
          {
            label: currentLanguage === 'ar' ? 'English' : 'العربية',
            onClick: () => setCurrentLanguage(currentLanguage === 'ar' ? 'en' : 'ar'),
            variant: 'secondary'
          },
          {
            label: getLocalizedText('منشور جديد', 'New Post'),
            href: selectedCategoryId 
              ? `/admin/posts/new?category=${selectedCategoryId}` 
              : '/admin/posts/new',
            icon: <PlusIcon className="h-4 w-4" />,
            variant: 'primary'
          }
        ]}
      />
      
      <div className={`flex flex-col gap-6 ${
        currentLanguage === 'ar' 
          ? 'lg:flex-row-reverse' 
          : 'lg:flex-row'
      }`}>
        {/* Categories sidebar */}
        <div className={`w-full lg:w-64 flex-shrink-0 ${
          currentLanguage === 'ar' ? 'lg:order-2' : 'lg:order-1'
        }`}>
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className={`text-lg font-medium text-gray-900 ${
                currentLanguage === 'ar' ? 'text-right' : 'text-left'
              }`}>{getLocalizedText('تصفية حسب الفئة', 'Filter by Category')}</h3>
            </div>
            <nav className="p-2">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleCategoryChange()}
                    className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                      currentLanguage === 'ar' ? 'text-right' : 'text-left'
                    } ${
                      !selectedCategoryId
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {getLocalizedText('جميع المنشورات', 'All Posts')}
                  </button>
                </li>
                {categories.map(category => (
                  <li key={category.id}>
                    <button
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                        currentLanguage === 'ar' ? 'text-right' : 'text-left'
                      } ${
                        selectedCategoryId === category.id
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {getCategoryName(category)}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className={`flex-1 ${
          currentLanguage === 'ar' ? 'lg:order-1' : 'lg:order-2'
        }`}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <DataTable
            columns={columns}
            data={posts}
            total={pagination.total}
            page={pagination.page}
            limit={pagination.limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onSearch={handleSearch}
            loading={loading}
            searchPlaceholder={getLocalizedText('البحث في المنشورات بالعنوان أو المحتوى...', 'Search posts by title or content...')}
          />
        </div>
      </div>
    </div>
  );
} 