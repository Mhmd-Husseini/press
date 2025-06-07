import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const auth = useAuthContext();
  const router = useRouter();

  // Check if user is authenticated
  const isAuthenticated = Boolean(auth.user);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    if (!auth.user) return false;
    return auth.user.roles.includes('ADMIN') || auth.user.roles.includes('SUPER_ADMIN');
  }, [auth.user]);

  // Require authentication - redirect to login if not authenticated
  const requireAuth = useCallback(() => {
    if (!isAuthenticated && !auth.loading) {
      router.push('/admin/login');
      return false;
    }
    return true;
  }, [isAuthenticated, auth.loading, router]);

  // Require admin role - redirect if not admin
  const requireAdmin = useCallback(() => {
    if (!requireAuth()) return false;
    
    if (!isAdmin()) {
      router.push('/admin'); // Redirect to dashboard if not admin
      return false;
    }
    return true;
  }, [requireAuth, isAdmin, router]);

  return {
    ...auth,
    isAuthenticated,
    isAdmin,
    requireAuth,
    requireAdmin,
  };
} 