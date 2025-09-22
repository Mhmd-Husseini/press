'use client';

import { getUserById } from '@/app/actions/user';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RoleGuard from '@/components/shared/RoleGuard';
import { useState, useEffect, use } from 'react';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const result = await getUserById(userId);
        
        if (!result.success || !result.user) {
          setError('User not found');
          return;
        }
        
        setUser(result.user);
      } catch (err) {
        setError('Failed to load user');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [userId]);

  // Unauthorized access message
  const unauthorizedFallback = (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
      <h3 className="text-lg font-medium">Access Denied</h3>
      <p className="mt-2">You don't have permission to view user details.</p>
      <Link href="/admin" className="mt-4 inline-block text-blue-600 hover:underline">
        Return to Admin Dashboard
      </Link>
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Loading user information...</div>;
  }

  if (error || !user) {
    return notFound();
  }
  
  return (
    <RoleGuard
      roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL', 'SENIOR_EDITOR']}
      fallback={unauthorizedFallback}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Details</h1>
          <div className="flex gap-2">
            <RoleGuard roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL']}>
              <Link
                href={`/admin/users/${user.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit User
              </Link>
            </RoleGuard>
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Users
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 block text-sm">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Name</span>
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                </div>
                {(user.firstNameArabic || user.lastNameArabic) && (
                  <div>
                    <span className="text-gray-500 block text-sm">Name (Arabic)</span>
                    <span className="font-medium">{user.firstNameArabic} {user.lastNameArabic}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block text-sm">Status</span>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Language Preference</span>
                  <span className="font-medium">{user.languagePreference === 'ar' ? 'Arabic' : 'English'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Roles & Dates</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 block text-sm">Roles</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.roles && user.roles.map((role: any, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                      >
                        {role.role.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Created At</span>
                  <span className="font-medium">{new Date(user.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm">Last Updated</span>
                  <span className="font-medium">{new Date(user.updatedAt).toLocaleString()}</span>
                </div>
                {user.lastLogin && (
                  <div>
                    <span className="text-gray-500 block text-sm">Last Login</span>
                    <span className="font-medium">{new Date(user.lastLogin).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {(user.bio || user.bioArabic) && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Biography</h2>
              {user.bio && (
                <div className="mb-4">
                  <span className="text-gray-500 block text-sm mb-1">English</span>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{user.bio}</p>
                </div>
              )}
              {user.bioArabic && (
                <div>
                  <span className="text-gray-500 block text-sm mb-1">Arabic</span>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{user.bioArabic}</p>
                </div>
              )}
            </div>
          )}
          
          {user.avatar && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Avatar</h2>
              <div className="w-24 h-24 rounded-full overflow-hidden">
                <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
} 