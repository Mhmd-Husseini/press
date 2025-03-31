'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PostStatus } from '@prisma/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistance } from 'date-fns';

interface Post {
  id: string;
  translations: {
    locale: string;
    title: string;
  }[];
  author: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  status: PostStatus;
  updatedAt: string;
}

export default function EditorialDashboard() {
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waitingApproval, setWaitingApproval] = useState<Post[]>([]);
  const [readyToPublish, setReadyToPublish] = useState<Post[]>([]);
  const [recentlyPublished, setRecentlyPublished] = useState<Post[]>([]);
  const [myDrafts, setMyDrafts] = useState<Post[]>([]);
  
  // Check permissions
  const canApprove = hasPermission('approve_content');
  const canPublish = hasPermission('publish_content');
  const isEditor = hasPermission('edit_content') || hasPermission('edit_own_content');
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch posts waiting for approval
        if (canApprove) {
          const approvalResponse = await fetch('/api/admin/posts?status=WAITING_APPROVAL&limit=5');
          if (!approvalResponse.ok) throw new Error('Failed to fetch posts waiting for approval');
          const approvalData = await approvalResponse.json();
          setWaitingApproval(approvalData.posts);
        }
        
        // Fetch posts ready to publish
        if (canPublish) {
          const publishResponse = await fetch('/api/admin/posts?status=READY_TO_PUBLISH&limit=5');
          if (!publishResponse.ok) throw new Error('Failed to fetch posts ready to publish');
          const publishData = await publishResponse.json();
          setReadyToPublish(publishData.posts);
        }
        
        // Fetch recently published posts
        const publishedResponse = await fetch('/api/admin/posts?status=PUBLISHED&limit=5');
        if (!publishedResponse.ok) throw new Error('Failed to fetch recently published posts');
        const publishedData = await publishedResponse.json();
        setRecentlyPublished(publishedData.posts);
        
        // Fetch current user's draft posts
        if (isEditor && user?.id) {
          const draftsResponse = await fetch(`/api/admin/posts?status=DRAFT&authorId=${user.id}&limit=5`);
          if (!draftsResponse.ok) throw new Error('Failed to fetch your draft posts');
          const draftsData = await draftsResponse.json();
          setMyDrafts(draftsData.posts);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    }
    
    fetchData();
  }, [canApprove, canPublish, isEditor, user?.id]);
  
  // Get post title - prefer English if available
  const getPostTitle = (post: Post) => {
    const enTranslation = post.translations.find(t => t.locale === 'en');
    const anyTranslation = post.translations[0];
    return (enTranslation || anyTranslation)?.title || 'Untitled Post';
  };
  
  // Get author name
  const getAuthorName = (author: Post['author']) => {
    if (author.firstName || author.lastName) {
      return `${author.firstName || ''} ${author.lastName || ''}`.trim();
    }
    return author.email;
  };
  
  // Format relative time
  const getRelativeTime = (date: string) => {
    try {
      return formatDistance(new Date(date), new Date(), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="h-4 bg-gray-100 rounded w-full"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <p className="text-sm text-red-700 mt-1">Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }
  
  const renderPostList = (posts: Post[], emptyMessage: string, bgColor: string, status?: string) => {
    if (posts.length === 0) {
      return (
        <div className="py-4 px-6 text-gray-500 text-sm">{emptyMessage}</div>
      );
    }
    
    return (
      <div className="divide-y divide-gray-100">
        {posts.map((post) => (
          <div key={post.id} className="py-3 px-6 flex items-center justify-between hover:bg-gray-50">
            <div className="flex-1 min-w-0">
              <Link 
                href={`/admin/posts/${post.id}`} 
                className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
              >
                {getPostTitle(post)}
              </Link>
              <p className="text-xs text-gray-500 mt-1">
                By {getAuthorName(post.author)} • {getRelativeTime(post.updatedAt)}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <Link
                href={`/admin/posts/${post.id}`}
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                {status ? status : 'View'}
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {canApprove && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-yellow-50 px-6 py-4 border-l-4 border-yellow-400">
            <h3 className="font-medium text-yellow-800">Waiting for Approval</h3>
          </div>
          {renderPostList(
            waitingApproval, 
            'No posts waiting for approval.',
            'bg-yellow-50',
            'Review'
          )}
          {waitingApproval.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 text-right">
              <Link href="/admin/content?status=WAITING_APPROVAL" className="text-sm text-gray-600 hover:text-gray-900">
                View all posts waiting for approval →
              </Link>
            </div>
          )}
        </div>
      )}
      
      {canPublish && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-l-4 border-green-400">
            <h3 className="font-medium text-green-800">Ready to Publish</h3>
          </div>
          {renderPostList(
            readyToPublish, 
            'No posts ready to publish.',
            'bg-green-50',
            'Publish'
          )}
          {readyToPublish.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 text-right">
              <Link href="/admin/content?status=READY_TO_PUBLISH" className="text-sm text-gray-600 hover:text-gray-900">
                View all ready to publish →
              </Link>
            </div>
          )}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-6 py-4 border-l-4 border-blue-400">
          <h3 className="font-medium text-blue-800">Recently Published</h3>
        </div>
        {renderPostList(
          recentlyPublished, 
          'No recently published posts.',
          'bg-blue-50'
        )}
        {recentlyPublished.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 text-right">
            <Link href="/admin/content?status=PUBLISHED" className="text-sm text-gray-600 hover:text-gray-900">
              View all published posts →
            </Link>
          </div>
        )}
      </div>
      
      {isEditor && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-l-4 border-gray-400">
            <h3 className="font-medium text-gray-800">My Drafts</h3>
          </div>
          {renderPostList(
            myDrafts, 
            'No draft posts.',
            'bg-gray-50',
            'Edit'
          )}
          {myDrafts.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 text-right">
              <Link href="/admin/content?status=DRAFT&authorId=me" className="text-sm text-gray-600 hover:text-gray-900">
                View all my drafts →
              </Link>
            </div>
          )}
        </div>
      )}
      
      <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Editorial Workflow</h3>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create New Post
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-500 mb-2">For Authors & Editors</h4>
            <ol className="space-y-4 text-sm">
              <li className="flex">
                <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-800 font-medium mr-3">1</span>
                <div>
                  <p className="font-medium">Create a draft</p>
                  <p className="text-gray-500">Start writing your post and save it as a draft.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-800 font-medium mr-3">2</span>
                <div>
                  <p className="font-medium">Submit for approval</p>
                  <p className="text-gray-500">Once ready, submit your draft for review by a senior editor.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-800 font-medium mr-3">3</span>
                <div>
                  <p className="font-medium">Make revisions if needed</p>
                  <p className="text-gray-500">If declined, address the feedback and resubmit.</p>
                </div>
              </li>
            </ol>
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-500 mb-2">For Senior Editors</h4>
            <ol className="space-y-4 text-sm">
              <li className="flex">
                <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-yellow-100 text-yellow-800 font-medium mr-3">1</span>
                <div>
                  <p className="font-medium">Review submissions</p>
                  <p className="text-gray-500">Review posts submitted for approval.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-800 font-medium mr-3">2</span>
                <div>
                  <p className="font-medium">Approve for publishing</p>
                  <p className="text-gray-500">Mark approved posts as ready to publish.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 font-medium mr-3">3</span>
                <div>
                  <p className="font-medium">Publish approved content</p>
                  <p className="text-gray-500">Make the content live on the site.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 