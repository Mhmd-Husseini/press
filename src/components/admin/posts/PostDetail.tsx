'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PostStatus } from '@prisma/client';
import Link from 'next/link';
import { PostWithRelations } from '@/lib/services/post.service';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import EditorialWorkflow from './EditorialWorkflow';
import { useAuth } from '@/contexts/AuthContext';

interface PostDetailProps {
  post: PostWithRelations;
}

export default function PostDetail({ post }: PostDetailProps) {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isOwnPost = user && post.authorId === user.id;
  const canEditPost = hasPermission('edit_content') || (hasPermission('edit_own_content') && isOwnPost);
  const canDeletePost = hasPermission('delete_content');
  
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };
  
  const handleStatusChange = async (newStatus: PostStatus, reason?: string) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/posts/${post.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          reason
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update post status');
      }
      
      // Refresh the page to show the updated status
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'An error occurred while updating the post status');
      console.error('Error updating post status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!canDeletePost || isLoading) return;
    
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete post');
      }
      
      // Redirect to posts list
      router.push('/admin/content');
    } catch (error: any) {
      setError(error.message || 'An error occurred while deleting the post');
      console.error('Error deleting post:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get the title for the current post (preferring English if available)
  const getTitle = () => {
    const enTranslation = post.translations.find(t => t.locale === 'en');
    const anyTranslation = post.translations[0];
    return (enTranslation || anyTranslation)?.title || 'Untitled Post';
  };
  
  // Get the author name
  const getAuthorName = () => {
    if (post.authorName) return post.authorName;
    if (post.author?.firstName || post.author?.lastName) {
      return `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim();
    }
    return post.author?.email || 'Unknown Author';
  };
  
  // Handle editor, publisher, etc.
  const getEditorName = (user: any) => {
    if (!user) return 'N/A';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };
  
  return (
    <div>
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
      
      <div className="flex justify-between items-center mb-4">
        <Link 
          href="/admin/content" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Posts
        </Link>
        
        <div className="flex space-x-2">
          {canEditPost && (
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 text-sm hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </Link>
          )}
          
          {canDeletePost && (
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md bg-white text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{getTitle()}</h1>
        
        {post.featured && (
          <div className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mb-3">
            Featured
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Author</h3>
            <p className="mt-1">{getAuthorName()}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Category</h3>
            <p className="mt-1">
              {post.category?.translations.find(t => t.locale === 'en')?.name || 
               post.category?.translations[0]?.name || 'Uncategorized'}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Created</h3>
            <p className="mt-1">{formatDate(post.createdAt)}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
            <p className="mt-1">{formatDate(post.updatedAt)}</p>
          </div>
          
          {post.publishedAt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Published</h3>
              <p className="mt-1">{formatDate(post.publishedAt)}</p>
            </div>
          )}
          
          {post.tags && post.tags.length > 0 && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Tags</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {post.tags.map(item => (
                  <span
                    key={item.tag.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {item.tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <EditorialWorkflow 
        post={post} 
        onStatusChange={handleStatusChange} 
        disabled={isLoading}
      />
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Editorial Information</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Editor</h3>
              <p className="mt-1">{post.editor ? getEditorName(post.editor) : 'Not edited yet'}</p>
            </div>
            
            {post.approvedBy && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Approved By</h3>
                <p className="mt-1">{getEditorName(post.approvedBy)}</p>
              </div>
            )}
            
            {post.publishedBy && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Published By</h3>
                <p className="mt-1">{getEditorName(post.publishedBy)}</p>
              </div>
            )}
            
            {post.unpublishedBy && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Unpublished By</h3>
                <p className="mt-1">{getEditorName(post.unpublishedBy)}</p>
              </div>
            )}
            
            {post.declinedBy && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Declined By</h3>
                <p className="mt-1">{getEditorName(post.declinedBy)}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Available Translations</h2>
          
          <div className="space-y-2">
            {post.translations.map(translation => (
              <div key={translation.locale} className="p-3 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">
                      {translation.locale === 'en' ? 'English' : 
                       translation.locale === 'ar' ? 'Arabic' : translation.locale}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {translation.title}
                    </p>
                  </div>
                  <Link
                    href={`/admin/posts/${post.id}/preview?locale=${translation.locale}`}
                    target="_blank"
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Preview
                  </Link>
                </div>
              </div>
            ))}
            
            {post.translations.length === 0 && (
              <p className="text-gray-500">No translations available</p>
            )}
          </div>
        </div>
      </div>
      
      {post.media && post.media.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-6 mt-6">
          <h2 className="text-lg font-medium mb-4">Media</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {post.media.map(item => (
              <div key={item.id} className="relative group">
                <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                  <img 
                    src={item.media?.url} 
                    alt={item.media?.altText || 'Post media'} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {item.title || item.url.split('/').pop()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {post.revisionHistory && post.revisionHistory.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-6 mt-6">
          <h2 className="text-lg font-medium mb-4">Revision History</h2>
          
          <div className="space-y-3">
            {post.revisionHistory.map((revision, index) => (
              <div key={revision.id} className="p-3 border border-gray-200 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500">
                      {new Date(revision.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">
                        {revision.changedBy.firstName || revision.changedBy.email}
                      </span>{' '}
                      {revision.changeNote}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        revision.status === PostStatus.PUBLISHED ? 'bg-blue-100 text-blue-800' : 
                        revision.status === PostStatus.DRAFT ? 'bg-gray-100 text-gray-800' :
                        revision.status === PostStatus.WAITING_APPROVAL ? 'bg-yellow-100 text-yellow-800' :
                        revision.status === PostStatus.READY_TO_PUBLISH ? 'bg-green-100 text-green-800' :
                        revision.status === PostStatus.DECLINED ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {revision.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 