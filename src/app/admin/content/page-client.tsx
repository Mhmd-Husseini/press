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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.translations[0]?.name || 'Unknown Category';
  };

  const getPostTitle = (post: Post) => {
    // Look for English translation first, then fallback to first available
    const enTranslation = post.translations.find(t => t.locale === 'en');
    const firstTranslation = post.translations[0];
    
    return enTranslation?.title || firstTranslation?.title || 'Untitled Post';
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
      case 'PUBLISHED': return 'Published';
      case 'DRAFT': return 'Draft';
      case 'PENDING_REVIEW': return 'Pending Review';
      case 'UNDER_REVIEW': return 'Under Review';
      case 'APPROVED': return 'Approved';
      case 'DECLINED': return 'Declined';
      case 'ARCHIVED': return 'Archived';
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

  // Define table columns
  const columns: Column<Post>[] = [
    {
      key: 'translations',
      label: 'Title',
      sortable: true,
      render: (_, post) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {truncateText(getPostTitle(post), 50)}
          </div>
          {post.featured && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
              Featured
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(status as PostStatus)}`}>
          {getStatusLabel(status as PostStatus)}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (_, post) => (
        <span className="text-sm text-gray-500">
          {post.category?.translations[0]?.name || 'Uncategorized'}
        </span>
      ),
    },
    {
      key: 'author',
      label: 'Author',
      render: (_, post) => (
        <span className="text-sm text-gray-500">
          {getAuthorName(post)}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Date',
      sortable: true,
      render: (updatedAt) => (
        <span className="text-sm text-gray-500">
          {formatDate(updatedAt as string)}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      className: 'text-right',
      render: (_, post) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/posts/${post.id}/edit`}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            Edit
          </Link>
          <Link
            href={`/posts/${(post.translations[0]?.slug || post.id)}`}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            target="_blank"
          >
            View
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="py-6 space-y-6">
      <PageHeader 
        title="Content Management" 
        description="Manage all your posts and articles"
        actions={[
          {
            label: 'New Post',
            href: selectedCategoryId 
              ? `/admin/posts/new?category=${selectedCategoryId}` 
              : '/admin/posts/new',
            icon: <PlusIcon className="h-4 w-4" />,
            variant: 'primary'
          }
        ]}
      />
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Filter by Category</h3>
            </div>
            <nav className="p-2">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleCategoryChange()}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      !selectedCategoryId
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    All Posts
                  </button>
                </li>
                {categories.map(category => (
                  <li key={category.id}>
                    <button
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedCategoryId === category.id
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {category.translations[0]?.name || 'Unnamed Category'}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
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
            searchPlaceholder="Search posts by title or content..."
          />
        </div>
      </div>
    </div>
  );
} 