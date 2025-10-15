'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface PostLock {
  postId: string;
  userId: string;
  userEmail: string;
  userName: string;
  lockedAt: string;
  lastHeartbeat: string;
}

interface PostLockGuardProps {
  postId: string;
  children: React.ReactNode;
}

export default function PostLockGuard({ postId, children }: PostLockGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [lockStatus, setLockStatus] = useState<{
    isLocked: boolean;
    lock: PostLock | null;
    hasLock: boolean;
    loading: boolean;
    error: string | null;
  }>({
    isLocked: false,
    lock: null,
    hasLock: false,
    loading: true,
    error: null
  });

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lockAcquiredRef = useRef(false);

  // Acquire lock
  const acquireLock = useCallback(async () => {
    if (!postId || !user) return;

    try {
      const response = await fetch(`/api/admin/posts/lock/${postId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        lockAcquiredRef.current = true;
        setLockStatus({
          isLocked: false,
          lock: data.lock,
          hasLock: true,
          loading: false,
          error: null
        });

        // Start heartbeat
        startHeartbeat();
      } else if (response.status === 409) {
        // Post is locked by another user
        setLockStatus({
          isLocked: true,
          lock: data.existingLock,
          hasLock: false,
          loading: false,
          error: null
        });
      } else {
        setLockStatus(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to acquire lock'
        }));
      }
    } catch (error) {
      console.error('Error acquiring lock:', error);
      setLockStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to acquire lock'
      }));
    }
  }, [postId, user]);

  // Release lock
  const releaseLock = useCallback(async () => {
    if (!postId || !lockAcquiredRef.current) return;

    try {
      await fetch(`/api/admin/posts/lock/${postId}`, {
        method: 'DELETE',
      });
      lockAcquiredRef.current = false;
      stopHeartbeat();
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }, [postId]);

  // Update heartbeat
  const updateHeartbeat = useCallback(async () => {
    if (!postId || !lockAcquiredRef.current) return;

    try {
      const response = await fetch(`/api/admin/posts/lock/${postId}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        // Lost the lock somehow, reacquire it
        console.warn('Lost lock, attempting to reacquire...');
        lockAcquiredRef.current = false;
        stopHeartbeat();
        await acquireLock();
      }
    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  }, [postId, acquireLock]);

  // Start heartbeat interval
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = setInterval(() => {
      updateHeartbeat();
    }, 30000); // Every 30 seconds
  }, [updateHeartbeat]);

  // Stop heartbeat interval
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Force release (admin only)
  const forceRelease = useCallback(async () => {
    if (!postId) return;

    try {
      const response = await fetch(`/api/admin/posts/lock/${postId}?force=true`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Try to acquire lock again
        await acquireLock();
      }
    } catch (error) {
      console.error('Error force releasing lock:', error);
    }
  }, [postId, acquireLock]);

  // Retry acquiring lock
  const retryAcquire = useCallback(async () => {
    setLockStatus(prev => ({ ...prev, loading: true }));
    await acquireLock();
  }, [acquireLock]);

  // Initial lock acquisition
  useEffect(() => {
    acquireLock();

    // Cleanup on unmount
    return () => {
      releaseLock();
    };
  }, [acquireLock, releaseLock]);

  // Release lock when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lockAcquiredRef.current) {
        // Use sendBeacon for reliable lock release on page unload
        navigator.sendBeacon(`/api/admin/posts/lock/${postId}`, JSON.stringify({ method: 'DELETE' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [postId]);

  // Loading state
  if (lockStatus.loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center justify-center space-x-3">
          <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Checking edit availability...</p>
        </div>
      </div>
    );
  }

  // Post is locked by another user
  if (lockStatus.isLocked && lockStatus.lock) {
    const lockedBy = lockStatus.lock.userName || lockStatus.lock.userEmail;
    const lockedAt = new Date(lockStatus.lock.lockedAt);
    const timeAgo = Math.round((Date.now() - lockedAt.getTime()) / 60000); // minutes ago

    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="max-w-2xl mx-auto">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-yellow-100 p-3">
              <svg className="h-12 w-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Post is Currently Being Edited
          </h2>

          {/* Message */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>{lockedBy}</strong> is currently editing this post.
                  {timeAgo > 0 && ` (started ${timeAgo} minute${timeAgo !== 1 ? 's' : ''} ago)`}
                </p>
                <p className="text-sm text-yellow-600 mt-2">
                  To prevent conflicts and data loss, only one person can edit a post at a time. 
                  Please wait for them to finish, or contact them to coordinate.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/admin/content')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Posts
            </button>
            <button
              onClick={retryAcquire}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Check Again
            </button>
            {user?.roles?.some(r => 
              r === 'SUPER_ADMIN' || 
              r === 'EDITOR_IN_CHIEF'
            ) && (
              <button
                onClick={forceRelease}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                title="Admin only: Force release the lock and take over editing"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Force Take Over (Admin)
              </button>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>The lock will automatically expire after 5 minutes of inactivity.</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (lockStatus.error) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{lockStatus.error}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={() => router.push('/admin/content')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Posts
          </button>
          <button
            onClick={retryAcquire}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success - user has the lock, render children
  return (
    <>
      {/* Lock status indicator */}
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              You have editing access. The post is locked while you edit to prevent conflicts.
            </p>
          </div>
        </div>
      </div>

      {children}
    </>
  );
}

