'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/admin/PageHeader';
import Link from 'next/link';
import { CategoryWithTranslations } from '@/lib/services/category.service';

export default function ContentPage() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category');
  
  const [categories, setCategories] = useState<CategoryWithTranslations[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithTranslations | null>(null);
  const [posts, setPosts] = useState([]);
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
        
        // If a category is selected in the URL, find it
        if (categoryId) {
          const category = data.find((c: CategoryWithTranslations) => c.id === categoryId);
          if (category) {
            setSelectedCategory(category);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories');
      }
    };

    fetchCategories();
  }, [categoryId]);

  // Fetch posts whenever the selected category changes
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const url = selectedCategory 
          ? `/api/admin/posts?category=${selectedCategory.id}` 
          : '/api/admin/posts';
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch posts');
        
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedCategory]);

  const getCategoryName = (category: CategoryWithTranslations) => {
    return category.translations[0]?.name || 'Unnamed Category';
  };

  return (
    <>
      <PageHeader 
        title={selectedCategory ? `Content: ${getCategoryName(selectedCategory)}` : 'All Content'}
        description="Manage your website content"
        buttonText="Add New Post"
        buttonHref={selectedCategory ? `/admin/content/new?category=${selectedCategory.id}` : '/admin/content/new'}
        buttonPermission="create_content"
      />
      
      <div className="mt-6 bg-white rounded-md shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Categories</h2>
            <Link 
              href="/admin/categories"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Manage Categories
            </Link>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <Link 
              href="/admin/content"
              className={`px-3 py-1 rounded-full text-sm ${!selectedCategory 
                ? 'bg-indigo-100 text-indigo-800 font-medium' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </Link>
            
            {categories.map(category => (
              <Link 
                key={category.id}
                href={`/admin/content?category=${category.id}`}
                className={`px-3 py-1 rounded-full text-sm ${selectedCategory?.id === category.id 
                  ? 'bg-indigo-100 text-indigo-800 font-medium' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {getCategoryName(category)}
              </Link>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : posts.length > 0 ? (
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
                    Author
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post: any) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {post.translations?.[0]?.title || 'Untitled'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 
                        post.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.author?.firstName ? `${post.author.firstName} ${post.author.lastName || ''}` : post.author?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/admin/content/${post.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </Link>
                      <Link 
                        href={`/admin/content/${post.id}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-500 mb-4">
              {selectedCategory 
                ? `No posts found in the "${getCategoryName(selectedCategory)}" category.` 
                : 'No posts have been created yet.'}
            </p>
            <Link
              href={selectedCategory ? `/admin/content/new?category=${selectedCategory.id}` : '/admin/content/new'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create New Post
            </Link>
          </div>
        )}
      </div>
    </>
  );
} 