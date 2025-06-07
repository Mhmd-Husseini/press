'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DataTable, Column } from '@/components/shared/data-table';
import PageHeader from '@/components/admin/PageHeader';
import RoleGuard from '@/components/shared/RoleGuard';
import { CategoryWithTranslations } from '@/lib/services/category.service';

interface CategoriesResponse {
  categories: CategoryWithTranslations[];
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function CategoryManagementClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [categories, setCategories] = useState<CategoryWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Get current pagination state from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentLimit = parseInt(searchParams.get('limit') || '10');
  const currentSearch = searchParams.get('search') || '';
  const locale = searchParams.get('locale') || 'en';

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
        locale,
        ...(currentSearch && { search: currentSearch })
      });

      const response = await fetch(`/api/admin/categories?${params}`);
      if (response.ok) {
        const data: CategoriesResponse = await response.json();
        setCategories(data.categories);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          pages: data.pages
        });
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCategories();
        setDeleteConfirm(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/admin/categories?${params.toString()}`);
  };

  const handleLimitChange = (limit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', limit.toString());
    params.set('page', '1'); // Reset to first page
    router.push(`/admin/categories?${params.toString()}`);
  };

  const handleSearch = (search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset to first page
    router.push(`/admin/categories?${params.toString()}`);
  };

  // Fetch data when URL parameters change
  useEffect(() => {
    fetchCategories();
  }, [currentPage, currentLimit, currentSearch, locale]);

  // Get category name based on locale
  const getCategoryName = (category: CategoryWithTranslations) => {
    const translation = category.translations.find(t => t.locale === locale) || category.translations[0];
    return translation?.name || 'Unnamed Category';
  };

  // Get category description based on locale
  const getCategoryDescription = (category: CategoryWithTranslations) => {
    const translation = category.translations.find(t => t.locale === locale) || category.translations[0];
    return translation?.description || '';
  };

  // Get category slug based on locale
  const getCategorySlug = (category: CategoryWithTranslations) => {
    const translation = category.translations.find(t => t.locale === locale) || category.translations[0];
    return translation?.slug || '';
  };

  // Define table columns
  const columns: Column<CategoryWithTranslations>[] = [
    {
      key: 'translations',
      label: 'Category',
      sortable: true,
      render: (_, category) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {getCategoryName(category)}
          </div>
          {getCategoryDescription(category) && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {getCategoryDescription(category)}
            </div>
          )}
          <div className="text-xs text-gray-400">
            Slug: {getCategorySlug(category)}
          </div>
        </div>
      ),
    },
    {
      key: 'parent',
      label: 'Parent',
      render: (_, category) => (
        <span className="text-sm text-gray-600">
          {category.parent ? getCategoryName(category.parent) : '-'}
        </span>
      ),
    },
    {
      key: '_count',
      label: 'Posts',
      render: (_, category) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {(category as any)._count?.posts || 0} posts
        </span>
      ),
    },
    {
      key: 'order',
      label: 'Order',
      sortable: true,
      render: (order) => (
        <span className="text-sm text-gray-900">
          {order}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (createdAt) => (
        <span className="text-sm text-gray-500">
          {new Date(createdAt as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      className: 'text-right',
      render: (_, category) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/categories/${category.id}`}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            View
          </Link>
          <RoleGuard roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL']}>
            <Link
              href={`/admin/categories/${category.id}/edit`}
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              Edit
            </Link>
            {(!category.children || category.children.length === 0) && 
             (!(category as any)._count?.posts || (category as any)._count.posts === 0) && (
              <button
                onClick={() => setDeleteConfirm(category.id)}
                className="text-red-600 hover:text-red-900 text-sm font-medium"
              >
                Delete
              </button>
            )}
          </RoleGuard>
        </div>
      ),
    },
  ];

  // Unauthorized access message
  const unauthorizedFallback = (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
      <h3 className="text-lg font-medium">Access Denied</h3>
      <p className="mt-2">You don't have permission to view categories.</p>
      <Link href="/admin" className="mt-4 inline-block text-blue-600 hover:underline">
        Return to Admin Dashboard
      </Link>
    </div>
  );

  return (
    <RoleGuard 
      roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL', 'SENIOR_EDITOR', 'EDITOR']}
      fallback={unauthorizedFallback}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your content categories and hierarchy
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Locale Selector */}
            <select
              value={locale}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                params.set('locale', e.target.value);
                params.set('page', '1');
                router.push(`/admin/categories?${params.toString()}`);
              }}
              className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
            <RoleGuard roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL']}>
              <Link
                href="/admin/categories/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Category
              </Link>
            </RoleGuard>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={categories}
          total={pagination.total}
          page={pagination.page}
          limit={pagination.limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onSearch={handleSearch}
          loading={loading}
          searchPlaceholder="Search categories by name, description, or slug..."
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">Delete Category</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this category? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center space-x-4 mt-4">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
} 