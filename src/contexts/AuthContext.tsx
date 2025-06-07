'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { logout as serverLogout } from '@/app/actions/auth';

// Types for the user and auth context
interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  firstNameArabic?: string | null;
  lastNameArabic?: string | null;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermissions: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized function to fetch user data
  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      setError(null);
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const userData = await response.json();
        return userData;
      } else if (response.status === 401) {
        // Not authenticated, which is fine
        return null;
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user');
      return null;
    }
  }, []);

  // Function to refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    const userData = await fetchUser();
    setUser(userData);
  }, [fetchUser]);

  // Initial user load
  useEffect(() => {
    let mounted = true;

    const loadInitialUser = async () => {
      const userData = await fetchUser();
      if (mounted) {
        setUser(userData);
        setLoading(false);
      }
    };

    loadInitialUser();

    return () => {
      mounted = false;
    };
  }, [fetchUser]);

  // Memoized permission checking functions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // Super admin role check
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')) {
      return true;
    }
    
    return user.permissions.includes(permission);
  }, [user]);

  const hasAnyPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await serverLogout();
      setUser(null);
      // Use router.push instead of window.location for better UX
      window.location.href = '/admin/login';
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  }, []);

  // Memoized context value
  const value = React.useMemo(() => ({
    user,
    loading,
    error,
    setUser,
    hasPermission,
    hasAnyPermissions,
    hasAllPermissions,
    logout,
    refreshUser,
  }), [user, loading, error, hasPermission, hasAnyPermissions, hasAllPermissions, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 