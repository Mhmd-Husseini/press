'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AuthorFormData {
  nameEn: string;
  nameAr: string;
  country: string;
  bio: string;
  bioAr: string;
  email: string;
  avatar: string;
  isActive: boolean;
  socialLinks: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export default function NewAuthorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AuthorFormData>({
    nameEn: '',
    nameAr: '',
    country: '',
    bio: '',
    bioAr: '',
    email: '',
    avatar: '',
    isActive: true,
    socialLinks: {}
  });
  const [errors, setErrors] = useState<Partial<AuthorFormData>>({});

  // Handle input changes
  const handleInputChange = (field: keyof AuthorFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle social links changes
  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<AuthorFormData> = {};

    if (!formData.nameEn.trim()) {
      newErrors.nameEn = 'English name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/authors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          socialLinks: Object.keys(formData.socialLinks).length > 0 ? formData.socialLinks : undefined
        })
      });

      if (response.ok) {
        router.push('/admin/authors');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create author');
      }
    } catch (error) {
      console.error('Error creating author:', error);
      alert('Failed to create author');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Add New Author</h1>
        <Link
          href="/admin/authors"
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back to Authors
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Name *
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => handleInputChange('nameEn', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nameEn ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter author's English name"
                />
                {errors.nameEn && (
                  <p className="mt-1 text-sm text-red-600">{errors.nameEn}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arabic Name
                </label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => handleInputChange('nameAr', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic text-right"
                  placeholder="أدخل اسم الكاتب بالعربية"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter author's country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter author's email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Biography */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Biography</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Biography
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter author's biography in English"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arabic Biography
                </label>
                <textarea
                  rows={4}
                  value={formData.bioAr}
                  onChange={(e) => handleInputChange('bioAr', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic text-right"
                  placeholder="أدخل السيرة الذاتية للكاتب بالعربية"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['twitter', 'facebook', 'linkedin', 'instagram'].map((platform) => (
                <div key={platform}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {platform}
                  </label>
                  <input
                    type="url"
                    value={formData.socialLinks[platform as keyof typeof formData.socialLinks] || ''}
                    onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`https://${platform}.com/username`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => handleInputChange('avatar', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active (author can be assigned to posts)
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/admin/authors"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Author'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 