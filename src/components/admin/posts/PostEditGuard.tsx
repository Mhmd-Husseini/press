'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PostEditGuardProps {
  children: ReactNode;
  authorId?: string;
  postId?: string;
}

export default function PostEditGuard({ children, authorId, postId }: PostEditGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userRoles = user.roles || [];
    
    // Super Admin, Editor in Chief, and Editorial can edit any post
    if (userRoles.includes('SUPER_ADMIN') || 
        userRoles.includes('EDITOR_IN_CHIEF') || 
        userRoles.includes('EDITORIAL')) {
      setCanEdit(true);
      setLoading(false);
      return;
    }
    
    // Senior Editor can edit any post
    if (userRoles.includes('SENIOR_EDITOR')) {
      setCanEdit(true);
      setLoading(false);
      return;
    }
    
    // Regular Editor can only edit their own posts
    if (userRoles.includes('EDITOR')) {
      // Check if this is the user's own post
      if (authorId && authorId === user.id) {
        setCanEdit(true);
      } else {
        setCanEdit(false);
      }
      setLoading(false);
      return;
    }
    
    // Default - no access
    setCanEdit(false);
    setLoading(false);
  }, [user, authorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-md shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
            <div className="mt-2 text-red-700">
              <p>You don't have permission to edit this post.</p>
              <p className="mt-2">
                As an Editor, you can only edit posts that you created.
              </p>
              <div className="mt-4">
                <Link 
                  href="/admin/content" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Content List
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 