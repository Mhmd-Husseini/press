'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/admin/PageHeader';
import { PostStatus } from '@prisma/client';
import { formatDate, truncateText } from '@/lib/utils';

interface Category {
  id: string;
  translations: { locale: string; name: string }[];
}

interface PostTranslation {
  locale: string;
  title: string;
}

interface Post {
  id: string;
  status: PostStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    translations: { locale: string; name: string }[];
  };
  author: {
    id: string;
    name: string;
  };
  translations: PostTranslation[];
}

export default function ContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get('category');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  
  // Fetch posts based on selected category
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setPosts([]);
      
      try {
        let url = '/api/admin/posts';
        
        if (selectedCategoryId) {
          url += `?categoryId=${selectedCategoryId}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch posts');
        
        const data = await response.json();
        setPosts(data.posts || []);
      } catch (err: any) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [selectedCategoryId]);
  
  const handleCategoryChange = (categoryId?: string) => {
    if (categoryId) {
      router.push(`/admin/content?category=${categoryId}`);
    } else {
      router.push('/admin/content');
    }
  };
  
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.translations[0]?.name || 'Uncategorized';
  };
  
  const getPostTitle = (post: Post) => {
    // Try to get English title first
    const englishTranslation = post.translations.find(t => t.locale === 'en');
    if (englishTranslation && englishTranslation.title) {
      return englishTranslation.title;
    }
    
    // Fall back to any available translation
    return post.translations[0]?.title || 'Untitled Post';
  };
  
  const getStatusClass = (status: PostStatus) => {
    switch (status) {
      case PostStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case PostStatus.READY_TO_PUBLISH:
        return 'bg-yellow-100 text-yellow-800';
      case PostStatus.WAITING_APPROVAL:
        return 'bg-blue-100 text-blue-800';
      case PostStatus.PUBLISHED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusLabel = (status: PostStatus) => {
    switch (status) {
      case PostStatus.DRAFT:
        return 'Draft';
      case PostStatus.READY_TO_PUBLISH:
        return 'Ready to Publish';
      case PostStatus.WAITING_APPROVAL:
        return 'Waiting Approval';
      case PostStatus.PUBLISHED:
        return 'Published';
      default:
        return 'Unknown';
    }
  };
  
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
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Categories sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Categories</h3>
            </div>
            <nav className="p-2">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleCategoryChange()}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${
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
                      className={`w-full text-left px-3 py-2 text-sm rounded-md ${
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
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedCategoryId 
                  ? `Posts in ${getCategoryName(selectedCategoryId)}`
                  : 'All Posts'}
              </h3>
              <span className="text-sm text-gray-500">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>
            
            {loading ? (
              <div className="p-4">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-md"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="bg-red-50 p-4 rounded-md text-red-700">
                  {error}
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-1">No posts found</h3>
                <p className="text-gray-500 mb-6">
                  {selectedCategoryId
                    ? `There are no posts in this category yet.`
                    : `You haven't created any posts yet.`}
                </p>
                <Link
                  href={selectedCategoryId 
                    ? `/admin/posts/new?category=${selectedCategoryId}` 
                    : '/admin/posts/new'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create your first post
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {posts.map(post => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {truncateText(getPostTitle(post), 50)}
                          </div>
                          {post.featured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                              Featured
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(post.status)}`}>
                            {getStatusLabel(post.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {post.category?.translations[0]?.name || 'Uncategorized'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {post.author?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(post.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/posts/${post.id}`}
                            className="text-gray-600 hover:text-gray-900"
                            target="_blank"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 