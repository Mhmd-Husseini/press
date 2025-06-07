'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import PermissionGuard from '@/components/shared/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, error, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') {
      return true;
    }
    return path !== '/admin' && pathname.startsWith(path);
  };

  // Get the active link class
  const getNavLinkClass = (path: string) => {
    const baseClass = "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium";
    return isActive(path)
      ? `${baseClass} border-indigo-500 text-gray-900`
      : `${baseClass} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Handle login navigation
  const handleLogin = () => {
    router.push('/admin/login');
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return '';
    
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    
    return user.email;
  };

  // If auth is still loading, show a simplified header
  if (loading) {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-gray-800">
                  Admin Panel
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Show error state if there's an auth error
  if (error) {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-gray-800">
                  Admin Panel
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <span className="text-red-600 text-sm">Auth Error</span>
                  <button
                    onClick={handleLogin}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="font-bold text-xl text-gray-800">
                Admin Panel
              </Link>
            </div>
            <nav className="ml-6 flex space-x-8">
              <Link 
                href="/admin" 
                className={getNavLinkClass('/admin')}
              >
                Dashboard
              </Link>
              
              <PermissionGuard permissions="view_users">
                <Link 
                  href="/admin/users" 
                  className={getNavLinkClass('/admin/users')}
                >
                  Users
                </Link>
              </PermissionGuard>
              
              <PermissionGuard permissions="view_content">
                <Link 
                  href="/admin/content" 
                  className={getNavLinkClass('/admin/content')}
                >
                  Content
                </Link>
              </PermissionGuard>
              
              <PermissionGuard permissions="view_categories">
                <Link 
                  href="/admin/categories" 
                  className={getNavLinkClass('/admin/categories')}
                >
                  Categories
                </Link>
              </PermissionGuard>
              
              <PermissionGuard permissions="view_authors">
                <Link 
                  href="/admin/authors" 
                  className={getNavLinkClass('/admin/authors')}
                >
                  Authors
                </Link>
              </PermissionGuard>
              
              <PermissionGuard permissions={['view_roles', 'view_permissions']}>
                <div className="relative group inline-flex items-center h-full">
                  <button className={getNavLinkClass('/admin/access-control')}>
                    Access Control
                  </button>
                  <div className="hidden group-hover:block absolute left-0 top-full mt-0.5 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                    <PermissionGuard permissions="view_roles">
                      <Link 
                        href="/admin/roles" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Roles
                      </Link>
                    </PermissionGuard>
                    
                    <PermissionGuard permissions="view_permissions">
                      <Link 
                        href="/admin/permissions" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Permissions
                      </Link>
                    </PermissionGuard>
                  </div>
                </div>
              </PermissionGuard>
              
              <PermissionGuard permissions="manage_media">
                <Link 
                  href="/admin/media" 
                  className={getNavLinkClass('/admin/media')}
                >
                  Media
                </Link>
              </PermissionGuard>
            </nav>
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative">
              {user ? (
                <div className="flex items-center space-x-3">
                  <button className="bg-gray-100 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                    <span className="sr-only">View notifications</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center"
                      aria-expanded={isProfileOpen}
                      aria-haspopup="true"
                    >
                      <img
                        className="h-8 w-8 rounded-full"
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                        alt="User profile"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {getUserDisplayName()}
                      </span>
                      <svg 
                        className={`ml-1 h-5 w-5 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'transform rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                        <Link 
                          href="/admin/profile" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Your Profile
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}