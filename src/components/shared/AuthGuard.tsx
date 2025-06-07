'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAdmin = false, 
  fallback,
  redirectTo = '/admin/login'
}: AuthGuardProps) {
  const { user, loading, error, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requireAdmin && !isAdmin()) {
      router.push('/admin'); // Redirect to dashboard if not admin
      return;
    }
  }, [loading, isAuthenticated, requireAdmin, isAdmin, router, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Authentication Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => router.push('/admin/login')}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show unauthorized message for non-admin users
  if (requireAdmin && !isAdmin()) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-orange-600 text-lg font-semibold mb-2">Access Denied</div>
          <div className="text-gray-600 mb-4">You don't have permission to access this page.</div>
          <button 
            onClick={() => router.push('/admin')}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show unauthenticated message
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Not Authenticated</div>
          <div className="text-gray-600 mb-4">Please log in to access this page.</div>
          <button 
            onClick={() => router.push(redirectTo)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
} 