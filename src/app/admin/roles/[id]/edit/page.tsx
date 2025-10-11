'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PermissionGuard from '@/components/shared/PermissionGuard';
import Link from 'next/link';

interface Permission {
  id: string;
  name: string;
  nameArabic?: string | null;
  description?: string | null;
}

interface Role {
  id: string;
  name: string;
  nameArabic?: string | null;
  description?: string | null;
  descriptionArabic?: string | null;
  permissions: Array<{
    permission: Permission;
  }>;
}

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    nameArabic: '',
    description: '',
    descriptionArabic: '',
    permissions: [] as string[],
  });

  // Load role and permissions on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Fetch role details
        const roleResponse = await fetch(`/api/admin/roles/${roleId}`);
        if (!roleResponse.ok) throw new Error('Failed to fetch role');
        const roleData = await roleResponse.json();
        
        // Fetch all permissions
        const permissionsResponse = await fetch('/api/admin/permissions');
        if (!permissionsResponse.ok) throw new Error('Failed to fetch permissions');
        const permissionsData = await permissionsResponse.json();
        
        setRole(roleData);
        setPermissions(permissionsData);
        
        // Set form data from role
        setFormData({
          name: roleData.name || '',
          nameArabic: roleData.nameArabic || '',
          description: roleData.description || '',
          descriptionArabic: roleData.descriptionArabic || '',
          permissions: roleData.permissions.map((p: any) => p.permission.name),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (roleId) {
      loadData();
    }
  }, [roleId]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle permission checkbox changes
  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      if (checked) {
        // Add permission
        return { ...prev, permissions: [...prev.permissions, value] };
      } else {
        // Remove permission
        return { ...prev, permissions: prev.permissions.filter(p => p !== value) };
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      // Redirect back to roles page on success
      router.push('/admin/roles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading role...</p>
        </div>
      </div>
    );
  }

  if (error && !role) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <Link href="/admin/roles" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
            ← Back to Roles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard 
      permissions={['manage_roles', 'edit_roles']} 
      fallback={<div className="p-4">You don't have permission to edit roles.</div>}
    >
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/admin/roles" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Roles
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Role: {role?.name}</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Edit Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name (English) *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="EDITOR"
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
                      value={formData.nameArabic}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      dir="rtl"
                      placeholder="محرر"
                    />
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Descriptions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description (English)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Content creation and editing permissions"
                    />
                  </div>
                  <div>
                    <label htmlFor="descriptionArabic" className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Arabic)
                    </label>
                    <textarea
                      id="descriptionArabic"
                      name="descriptionArabic"
                      value={formData.descriptionArabic}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      dir="rtl"
                      placeholder="صلاحيات إنشاء وتحرير المحتوى"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Permissions</h2>
                <div className="bg-gray-50 p-4 border rounded-md max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-3">
                        <div className="flex items-center h-5">
                          <input
                            id={`permission-${permission.id}`}
                            type="checkbox"
                            value={permission.name}
                            checked={formData.permissions.includes(permission.name)}
                            onChange={handlePermissionChange}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor={`permission-${permission.id}`} className="font-medium text-gray-900 text-sm">
                            {permission.name}
                          </label>
                          {permission.nameArabic && (
                            <p className="text-xs text-gray-500" dir="rtl">{permission.nameArabic}</p>
                          )}
                          {permission.description && (
                            <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {formData.permissions.length} permission(s)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Link
                  href="/admin/roles"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}

