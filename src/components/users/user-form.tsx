'use client';

import { UserWithRoles } from '@/lib/services/user.service';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useFormState } from 'react-dom';

interface Role {
  id: string;
  name: string;
  nameArabic?: string | null;
  description?: string | null;
}

type UserFormProps = {
  user?: Omit<UserWithRoles, 'password'>;
  onSubmit: (formData: FormData) => Promise<any>;
  submitButtonText: string;
};

export default function UserForm({ user, onSubmit, submitButtonText }: UserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    user?.roles?.map(r => r.role.name) || ['USER']
  );

  // Fetch roles from the database
  useEffect(() => {
    async function fetchRoles() {
      try {
        setLoadingRoles(true);
        const response = await fetch('/api/admin/roles');
        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }
        const roles = await response.json();
        setAvailableRoles(roles);
      } catch (err) {
        console.error('Error fetching roles:', err);
        setError('Failed to load roles. Using default roles instead.');
        // Fallback to default roles if API fails
        setAvailableRoles([
          { id: '1', name: 'ADMIN', description: 'Administrator' },
          { id: '2', name: 'USER', description: 'Regular user' },
          { id: '3', name: 'EDITOR', description: 'Content editor' }
        ]);
      } finally {
        setLoadingRoles(false);
      }
    }

    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Add roles as comma-separated string
      formData.set('roles', selectedRoles.join(','));
      
      // Add user ID if editing
      if (user?.id) {
        formData.set('id', user.id);
      }

      const result = await onSubmit(formData);

      if (result.success) {
        router.push('/dashboard/users');
        router.refresh();
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={user?.email || ''}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              defaultValue={user?.firstName || ''}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              defaultValue={user?.lastName || ''}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password {!user && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required={!user}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {user && (
              <p className="mt-1 text-sm text-gray-500">
                Leave blank to keep current password
              </p>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Additional Information</h3>
          
          <div>
            <label htmlFor="firstNameArabic" className="block text-sm font-medium text-gray-700">
              First Name (Arabic)
            </label>
            <input
              type="text"
              id="firstNameArabic"
              name="firstNameArabic"
              defaultValue={user?.firstNameArabic || ''}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              dir="rtl"
            />
          </div>
          
          <div>
            <label htmlFor="lastNameArabic" className="block text-sm font-medium text-gray-700">
              Last Name (Arabic)
            </label>
            <input
              type="text"
              id="lastNameArabic"
              name="lastNameArabic"
              defaultValue={user?.lastNameArabic || ''}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              dir="rtl"
            />
          </div>
          
          <div>
            <label htmlFor="languagePreference" className="block text-sm font-medium text-gray-700">
              Language Preference
            </label>
            <select
              id="languagePreference"
              name="languagePreference"
              defaultValue={user?.languagePreference || 'en'}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="isActive"
              name="isActive"
              defaultValue={user?.isActive === false ? 'false' : 'true'}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">User Roles</h3>
        {loadingRoles ? (
          <div className="flex gap-3">
            <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-md"></div>
            <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-md"></div>
            <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-md"></div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {availableRoles.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.name)}
                className={`px-4 py-2 rounded-md ${
                  selectedRoles.includes(role.name)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                title={role.description || role.name}
              >
                {role.name}
              </button>
            ))}
          </div>
        )}
        {selectedRoles.length === 0 && (
          <p className="text-sm text-red-500">Please select at least one role</p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Biography</h3>
        
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio (English)
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={user?.bio || ''}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="bioArabic" className="block text-sm font-medium text-gray-700">
            Bio (Arabic)
          </label>
          <textarea
            id="bioArabic"
            name="bioArabic"
            rows={4}
            defaultValue={user?.bioArabic || ''}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            dir="rtl"
          />
        </div>
      </div>

      {/* Avatar */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Avatar</h3>
        
        <div>
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
            Avatar URL
          </label>
          <input
            type="text"
            id="avatar"
            name="avatar"
            defaultValue={user?.avatar || ''}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {user?.avatar && (
            <div className="mt-2">
              <img 
                src={user.avatar} 
                alt="User avatar" 
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || selectedRoles.length === 0}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitButtonText}
        </button>
      </div>
    </form>
  );
} 