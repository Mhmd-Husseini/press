'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type RoleGuardProps = {
  roles: string | string[];
  type?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * A component that conditionally renders its children based on user roles
 * 
 * @param roles - A single role string or array of role strings
 * @param type - Whether the user needs all roles or any of them (default: 'any')
 * @param fallback - Optional content to show when user doesn't have required roles
 * @param children - Content to show when user has required roles
 */
export default function RoleGuard({
  roles,
  type = 'any',
  fallback = null,
  children,
}: RoleGuardProps) {
  const { user, loading } = useAuth();

  // Convert single role to array
  const roleArray = Array.isArray(roles) ? roles : [roles];

  // If auth is still loading, render nothing or a placeholder
  if (loading) {
    return null; // Or return a loading placeholder if needed
  }

  // If no user or no roles, deny access
  if (!user || !user.roles) {
    return <>{fallback}</>;
  }

  let hasAccess = false;

  if (type === 'all') {
    // User must have all specified roles
    hasAccess = roleArray.every(role => user.roles.includes(role));
  } else {
    // User must have at least one of the specified roles
    hasAccess = roleArray.some(role => user.roles.includes(role));
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 