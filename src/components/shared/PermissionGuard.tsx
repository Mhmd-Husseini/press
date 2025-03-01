'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type PermissionGuardProps = {
  permissions: string | string[];
  type?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * A component that conditionally renders its children based on user permissions
 * 
 * @param permissions - A single permission string or array of permission strings
 * @param type - Whether the user needs all permissions or any of them (default: 'any')
 * @param fallback - Optional content to show when user doesn't have required permissions
 * @param children - Content to show when user has required permissions
 */
export default function PermissionGuard({
  permissions,
  type = 'any',
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermissions, loading } = useAuth();

  // Convert single permission to array
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

  // If auth is still loading, render nothing or a placeholder
  if (loading) {
    return null; // Or return a loading placeholder if needed
  }

  let hasAccess = false;

  if (type === 'all') {
    hasAccess = hasAllPermissions(permissionArray);
  } else {
    hasAccess = hasAnyPermissions(permissionArray);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 