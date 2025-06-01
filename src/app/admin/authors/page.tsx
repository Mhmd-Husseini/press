'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function AuthorsPage() {
  const router = useRouter();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch authors
  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/authors?${params}`);
      if (response.ok) {
        const data: AuthorsResponse = await response.json();
        setAuthors(data.authors);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
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

  // Search effect
  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1);
      fetchAuthors();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // Page change effect
  useEffect(() => {
    fetchAuthors();
  }, [currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Authors</h1>
        <Link
          href="/admin/authors/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Add New Author
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Authors Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading authors...</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {authors.map((author) => (
                  <tr key={author.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {author.country || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {author._count.posts} posts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        author.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {author.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(author.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/authors/${author.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/authors/${author.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                      {author._count.posts === 0 && (
                        <button
                          onClick={() => setDeleteConfirm(author.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {authors.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No authors found matching your search.' : 'No authors yet. Create your first author.'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
              disabled={currentPage === pagination.pages}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Author
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this author? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 