'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGuard from '@/components/shared/PermissionGuard';

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
  createdAt: Date;
  permissions: Array<{
    permission: Permission;
  }>;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    nameArabic: '',
    description: '',
    descriptionArabic: '',
    permissions: [] as string[],
  });

  // Load roles and permissions on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Fetch roles
        const rolesResponse = await fetch('/api/admin/roles');
        if (!rolesResponse.ok) throw new Error('Failed to fetch roles');
        const rolesData = await rolesResponse.json();
        
        // Fetch permissions
        const permissionsResponse = await fetch('/api/admin/permissions');
        if (!permissionsResponse.ok) throw new Error('Failed to fetch permissions');
        const permissionsData = await permissionsResponse.json();
        
        setRoles(rolesData);
        setPermissions(permissionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRole(prev => ({ ...prev, [name]: value }));
  };

  // Handle permission checkbox changes
  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setNewRole(prev => {
      if (checked) {
        // Add permission
        return { ...prev, permissions: [...prev.permissions, value] };
      } else {
        // Remove permission
        return { ...prev, permissions: prev.permissions.filter(p => p !== value) };
      }
    });
  };

  // Handle role creation
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create role');
      }

      const createdRole = await response.json();
      
      // Add new role to the list
      setRoles(prev => [...prev, createdRole]);
      
      // Reset form
      setNewRole({
        name: '',
        nameArabic: '',
        description: '',
        descriptionArabic: '',
        permissions: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete role');
      }

      // Remove role from list
      setRoles(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading roles...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <PermissionGuard 
      permissions={['view_roles', 'manage_roles']} 
      fallback={<div className="p-4">You don't have permission to view this page.</div>}
    >
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Roles Management</h1>
        
        {/* Create Role Form */}
        <PermissionGuard permissions="create_roles">
          <div className="mb-8 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Create New Role</h2>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newRole.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                    value={newRole.nameArabic}
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
                    value={newRole.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Editors can create and edit content"
                  />
                </div>
                <div>
                  <label htmlFor="descriptionArabic" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Arabic)
                  </label>
                  <textarea
                    id="descriptionArabic"
                    name="descriptionArabic"
                    value={newRole.descriptionArabic}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    dir="rtl"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="bg-white p-3 border rounded-md max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={`permission-${permission.id}`}
                            type="checkbox"
                            value={permission.name}
                            checked={newRole.permissions.includes(permission.name)}
                            onChange={handlePermissionChange}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`permission-${permission.id}`} className="font-medium text-gray-700">
                            {permission.name}
                          </label>
                          {permission.description && (
                            <p className="text-gray-500">{permission.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </PermissionGuard>
        
        {/* Roles List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">All Roles</h2>
          {roles.length === 0 ? (
            <p className="text-gray-500">No roles found.</p>
          ) : (
            <div className="space-y-6">
              {roles.map((role) => (
                <div key={role.id} className="bg-white border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                      {role.nameArabic && <p className="text-sm text-gray-500" dir="rtl">{role.nameArabic}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <PermissionGuard permissions="edit_roles">
                        <a 
                          href={`/admin/roles/edit/${role.id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          Edit
                        </a>
                      </PermissionGuard>
                      <PermissionGuard permissions="delete_roles">
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </PermissionGuard>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {role.description && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Description:</h4>
                        <p className="text-sm text-gray-500">{role.description}</p>
                        {role.descriptionArabic && (
                          <p className="text-sm text-gray-500 mt-1" dir="rtl">{role.descriptionArabic}</p>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions:</h4>
                      {role.permissions.length === 0 ? (
                        <p className="text-sm text-gray-500">No permissions assigned.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.map(({ permission }) => (
                            <span
                              key={permission.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {permission.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
} 