'use client';

import { deleteUser } from '@/app/actions/user';
import { UserWithRoles } from '@/lib/services/user.service';
import Link from 'next/link';
import { useState } from 'react';
import { DataTable, Column } from '@/components/shared/data-table';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Define a type that matches what we get from the server action
type UserTableProps = {
  users: Array<Omit<UserWithRoles, 'password'>>;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  basePath?: string;
  allowEditing?: string[]; // List of roles that can edit/delete users
};

export default function UserTable({ 
  users, 
  meta, 
  basePath = '/admin/users',
  allowEditing 
}: UserTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Check if the current user has a role that allows editing
  const canEditUsers = () => {
    if (!allowEditing || !user || !user.roles) return true; // Default to true if not specified
    return allowEditing.some(role => user.roles.includes(role));
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setIsDeleting(userId);
    setError(null);

    try {
      const result = await deleteUser(userId);
      
      if (!result.success) {
        setError(result.error || 'Failed to delete user');
      } else {
        // Refresh after successful deletion
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePageChange = (page: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('page', page.toString());
    router.push(`${basePath}?${searchParams.toString()}`);
  };

  const handleLimitChange = (limit: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('limit', limit.toString());
    searchParams.set('page', '1'); // Reset to first page when changing limit
    router.push(`${basePath}?${searchParams.toString()}`);
  };

  const handleSearch = (search: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    if (search) {
      searchParams.set('search', search);
    } else {
      searchParams.delete('search');
    }
    searchParams.set('page', '1'); // Reset to first page on new search
    router.push(`${basePath}?${searchParams.toString()}`);
  };

  const columns: Column<Omit<UserWithRoles, 'password'>>[] = [
    {
      key: 'firstName' as keyof Omit<UserWithRoles, 'password'>,
      label: 'Name',
      sortable: true,
      render: (_, user) => (
        <div className="text-sm font-medium text-gray-900">
          {user.firstName} {user.lastName}
        </div>
      ),
    },
    {
      key: 'email' as keyof Omit<UserWithRoles, 'password'>,
      label: 'Email',
      sortable: true,
      render: (email) => <div className="text-sm text-gray-500">{email}</div>,
    },
    {
      key: 'roles' as keyof Omit<UserWithRoles, 'password'>,
      label: 'Roles',
      render: (roles) => (
        <div className="flex flex-wrap gap-1">
          {roles && Array.isArray(roles) && roles.map((role, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
            >
              {role.role.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'isActive' as keyof Omit<UserWithRoles, 'password'>,
      label: 'Status',
      render: (isActive) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt' as keyof Omit<UserWithRoles, 'password'>,
      label: 'Created At',
      sortable: true,
      render: (createdAt) => (
        <div className="text-sm text-gray-500">
          {new Date(createdAt as string).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'id' as keyof Omit<UserWithRoles, 'password'>,
      label: 'Actions',
      render: (_, user) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/users/${user.id}`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            View
          </Link>
          {canEditUsers() && (
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="text-blue-600 hover:text-blue-900"
            >
              Edit
            </Link>
          )}
          {canEditUsers() && (
            <button
              onClick={() => handleDelete(user.id)}
              disabled={isDeleting === user.id}
              className="text-red-600 hover:text-red-900 disabled:opacity-50"
            >
              {isDeleting === user.id ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <DataTable
        columns={columns}
        data={users}
        total={meta?.total || users.length}
        page={meta?.page || 1}
        limit={meta?.limit || 10}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSearch={handleSearch}
      />
    </div>
  );
} 