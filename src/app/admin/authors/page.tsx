'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DataTable, Column } from '@/components/shared/data-table';

interface Author {
  id: string;
  nameEn: string;
  nameAr?: string;
  country?: string;
  email?: string;
  isActive: boolean;
  _count: {
    posts: number;
  };
  createdAt: string;
}

interface AuthorsResponse {
  authors: Author[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

function AuthorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [authors, setAuthors] = useState<Author[]>([]);
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

  // Fetch authors
  const fetchAuthors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
        ...(currentSearch && { search: currentSearch })
      });

      const response = await fetch(`/api/admin/authors?${params}`);
      if (response.ok) {
        const data: AuthorsResponse = await response.json();
        setAuthors(data.authors);
        setPagination(data.pagination);
      } else {
        throw new Error('Failed to fetch authors');
      }
    } catch (err) {
      console.error('Error fetching authors:', err);
      setError('Failed to load authors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete author
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/authors/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAuthors();
        setDeleteConfirm(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete author');
      }
    } catch (error) {
      console.error('Error deleting author:', error);
      alert('Failed to delete author');
    }
  };

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/admin/authors?${params.toString()}`);
  };

  const handleLimitChange = (limit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', limit.toString());
    params.set('page', '1'); // Reset to first page
    router.push(`/admin/authors?${params.toString()}`);
  };

  const handleSearch = (search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset to first page
    router.push(`/admin/authors?${params.toString()}`);
  };

  // Fetch data when URL parameters change
  useEffect(() => {
    fetchAuthors();
  }, [currentPage, currentLimit, currentSearch]);

  // Define table columns
  const columns: Column<Author>[] = [
    {
      key: 'nameEn',
      label: 'Author',
      sortable: true,
      render: (_, author) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {author.nameEn}
          </div>
          {author.nameAr && (
            <div className="text-sm text-gray-500 font-arabic">
              {author.nameAr}
            </div>
          )}
          {author.email && (
            <div className="text-xs text-gray-400">
              {author.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'country',
      label: 'Country',
      render: (country) => (
        <span className="text-sm text-gray-900">
          {country || '-'}
        </span>
      ),
    },
    {
      key: '_count',
      label: 'Posts',
      render: (_, author) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {author._count.posts} posts
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (isActive) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isActive ? 'Active' : 'Inactive'}
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
      render: (_, author) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/authors/${author.id}`}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            View
          </Link>
          <Link
            href={`/admin/authors/${author.id}/edit`}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            Edit
          </Link>
          {author._count.posts === 0 && (
            <button
              onClick={() => setDeleteConfirm(author.id)}
              className="text-red-600 hover:text-red-900 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Authors</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your content authors and contributors
          </p>
        </div>
        <Link
          href="/admin/authors/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Author
        </Link>
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
        data={authors}
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSearch={handleSearch}
        loading={loading}
        searchPlaceholder="Search authors by name, country, or email..."
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Author</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this author? This action cannot be undone.
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
  );
}

export default function AuthorsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthorsContent />
    </Suspense>
  );
} 