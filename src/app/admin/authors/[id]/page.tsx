'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Author {
  id: string;
  nameEn: string;
  nameAr?: string;
  country?: string;
  bio?: string;
  bioAr?: string;
  email?: string;
  avatar?: string;
  isActive: boolean;
  socialLinks?: any;
  posts: Array<{
    id: string;
    status: string;
    publishedAt?: string;
    createdAt: string;
    translations: Array<{
      title: string;
      locale: string;
    }>;
  }>;
  _count: {
    posts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AuthorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const authorId = resolvedParams.id;
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAuthor() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/authors/${authorId}`);
        
        if (response.ok) {
          const authorData = await response.json();
          setAuthor(authorData);
        } else if (response.status === 404) {
          return notFound();
        } else {
          throw new Error('Failed to load author');
        }
      } catch (err) {
        console.error('Error loading author:', err);
        setError('Failed to load author');
      } finally {
        setLoading(false);
      }
    }

    loadAuthor();
  }, [authorId]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !author) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Author Details</h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/authors/${author.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Author
          </Link>
          <Link
            href="/admin/authors"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Authors
          </Link>
        </div>
      </div>

      {/* Author Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 block text-sm">English Name</span>
                  <span className="font-medium">{author.nameEn}</span>
                </div>
                {author.nameAr && (
                  <div>
                    <span className="text-gray-500 block text-sm">Arabic Name</span>
                    <span className="font-medium font-arabic text-right block" dir="rtl">{author.nameAr}</span>
                  </div>
                )}
                {author.country && (
                  <div>
                    <span className="text-gray-500 block text-sm">Country</span>
                    <span className="font-medium">{author.country}</span>
                  </div>
                )}
                {author.email && (
                  <div>
                    <span className="text-gray-500 block text-sm">Email</span>
                    <span className="font-medium">{author.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block text-sm">Status</span>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    author.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {author.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Statistics</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 block text-sm">Total Posts</span>
                  <span className="font-medium text-lg">{author._count.posts}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Created</span>
                  <span className="font-medium">{new Date(author.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Last Updated</span>
                  <span className="font-medium">{new Date(author.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Biography */}
          {(author.bio || author.bioAr) && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Biography</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {author.bio && (
                  <div>
                    <span className="text-gray-500 block text-sm mb-1">English</span>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{author.bio}</p>
                  </div>
                )}
                {author.bioAr && (
                  <div>
                    <span className="text-gray-500 block text-sm mb-1">Arabic</span>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded font-arabic text-right" dir="rtl">{author.bioAr}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Links */}
          {author.socialLinks && Object.keys(author.socialLinks).length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Social Media Links</h2>
              <div className="flex flex-wrap gap-4">
                {Object.entries(author.socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Avatar */}
          {author.avatar && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Avatar</h2>
              <div className="w-32 h-32 rounded-full overflow-hidden">
                <img src={author.avatar} alt={`${author.nameEn} avatar`} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {/* Recent Posts */}
          {author.posts && author.posts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Posts</h2>
              <div className="space-y-3">
                {author.posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {post.translations.find(t => t.locale === 'en')?.title || 
                           post.translations.find(t => t.locale === 'ar')?.title || 
                           'Untitled'}
                        </h3>
                        <div className="mt-1 text-sm text-gray-500">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            post.status === 'published' ? 'bg-green-100 text-green-800' :
                            post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {post.status}
                          </span>
                          {post.publishedAt && (
                            <span className="ml-2">
                              Published: {new Date(post.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {author.posts.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    And {author.posts.length - 5} more posts...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
