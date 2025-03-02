'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logout as serverLogout } from '@/app/actions/auth';

// Types for the user and auth context
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  firstNameArabic?: string;
  lastNameArabic?: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermissions: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  logout: () => Promise<void>;
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

  useEffect(() => {
    async function loadUser() {
      try {
        // Fetch current user from your API
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Super admin role check
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')) {
      return true;
    }
    
    return user.permissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermissions = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call the server action to logout
      await serverLogout();
      setUser(null);
      // Redirect to login
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const value = {
    user,
    loading,
    hasPermission,
    hasAnyPermissions,
    hasAllPermissions,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 