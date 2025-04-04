'use client';

import { getUsers } from '@/app/actions/user';
import Link from 'next/link';
import UserTable from '@/components/users/user-table';
import RoleGuard from '@/components/shared/RoleGuard';
import PermissionGuard from '@/components/shared/PermissionGuard';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const result = await getUsers(page, limit, search);
        if (result.success) {
          setUsers(result.users || []);
          setMeta(result.meta);
          setError(null);
        } else {
          setError(result.error || 'Failed to load users');
          setUsers([]);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [page, limit, search]);

  // Unauthorized access message
  const unauthorizedFallback = (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
      <h3 className="text-lg font-medium">Access Denied</h3>
      <p className="mt-2">You don't have permission to view the user management section.</p>
      <Link href="/admin" className="mt-4 inline-block text-blue-600 hover:underline">
        Return to Admin Dashboard
      </Link>
    </div>
  );

  return (
    <RoleGuard
      roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL', 'SENIOR_EDITOR']}
      fallback={unauthorizedFallback}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
          
          {/* Only SUPER_ADMIN, EDITOR_IN_CHIEF, and EDITORIAL can add users */}
          <RoleGuard roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL']}>
            <Link
              href="/admin/users/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add New User
            </Link>
          </RoleGuard>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>Error loading users: {error}</p>
          </div>
        ) : users && users.length > 0 ? (
          <UserTable 
            users={users} 
            meta={meta} 
            basePath="/admin/users"
            // Only allow editing/deleting for SUPER_ADMIN, EDITOR_IN_CHIEF, and EDITORIAL
            allowEditing={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL']}
          />
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-gray-500">
              {search ? `No users match "${search}"` : 'There are no users in the system yet.'}
            </p>
            {search && (
              <Link
                href="/admin/users"
                className="mt-4 inline-block text-blue-600 hover:underline"
              >
                Clear search
              </Link>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
} 