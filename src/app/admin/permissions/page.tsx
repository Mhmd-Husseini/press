'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGuard from '@/components/shared/PermissionGuard';

interface Permission {
  id: string;
  name: string;
  nameArabic?: string | null;
  description?: string | null;
  descriptionArabic?: string | null;
  createdAt: Date;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPermission, setNewPermission] = useState({
    name: '',
    nameArabic: '',
    description: '',
    descriptionArabic: '',
  });

  // Load permissions on mount
  useEffect(() => {
    async function loadPermissions() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/permissions');
        if (!response.ok) throw new Error('Failed to fetch permissions');
        
        const data = await response.json();
        setPermissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPermission(prev => ({ ...prev, [name]: value }));
  };

  // Handle permission creation
  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPermission),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create permission');
      }

      const createdPermission = await response.json();
      
      // Add new permission to the list
      setPermissions(prev => [...prev, createdPermission]);
      
      // Reset form
      setNewPermission({
        name: '',
        nameArabic: '',
        description: '',
        descriptionArabic: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Handle permission deletion
  const handleDeletePermission = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this permission?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/permissions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete permission');
      }

      // Remove permission from list
      setPermissions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading permissions...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <PermissionGuard 
      permissions={['view_permissions', 'manage_permissions']} 
      fallback={<div className="p-4">You don't have permission to view this page.</div>}
    >
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Permissions Management</h1>
        
        {/* Create Permission Form */}
        <PermissionGuard permissions="create_permissions">
          <div className="mb-8 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Create New Permission</h2>
            <form onSubmit={handleCreatePermission} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newPermission.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="create_users"
                  />
                </div>
                <div>
                  <label htmlFor="nameArabic" className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Arabic)
                  </label>
                  <input
                    type="text"
                    id="nameArabic"
                    name="nameArabic"
                    value={newPermission.nameArabic}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    dir="rtl"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newPermission.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Allows creating new users"
                  />
                </div>
                <div>
                  <label htmlFor="descriptionArabic" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Arabic)
                  </label>
                  <textarea
                    id="descriptionArabic"
                    name="descriptionArabic"
                    value={newPermission.descriptionArabic}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    dir="rtl"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Permission
                </button>
              </div>
            </form>
          </div>
        </PermissionGuard>
        
        {/* Permissions List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">All Permissions</h2>
          {permissions.length === 0 ? (
            <p className="text-gray-500">No permissions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissions.map((permission) => (
                    <tr key={permission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                        {permission.nameArabic && (
                          <div className="text-sm text-gray-500" dir="rtl">{permission.nameArabic}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{permission.description || '-'}</div>
                        {permission.descriptionArabic && (
                          <div className="text-sm text-gray-500" dir="rtl">{permission.descriptionArabic}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(permission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <PermissionGuard permissions="edit_permissions">
                          <a href={`/admin/permissions/edit/${permission.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                            Edit
                          </a>
                        </PermissionGuard>
                        <PermissionGuard permissions="delete_permissions">
                          <button
                            onClick={() => handleDeletePermission(permission.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </PermissionGuard>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
} 