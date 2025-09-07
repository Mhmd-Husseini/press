'use client';

import React from 'react';
import { PostStatus } from '@prisma/client';
import { useAuth } from '@/contexts/AuthContext';

interface PostStatusControlProps {
  value: PostStatus;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  authorId?: string;
  isEdit?: boolean;
}

export default function PostStatusControl({ value, onChange, authorId, isEdit = false }: PostStatusControlProps) {
  const { user } = useAuth();

  // If no user is logged in, show nothing
  if (!user) return null;

  // Check if the user is the author of the post
  const isAuthor = authorId === user.id;

  // Get available status options based on role
  const getAvailableStatuses = () => {
    const userRoles = user.roles || [];
    
    // Super Admin, Editor in Chief, and Editorial can do anything
    if (userRoles.includes('SUPER_ADMIN') || 
        userRoles.includes('EDITOR_IN_CHIEF') || 
        userRoles.includes('EDITORIAL')) {
      return [
        { value: PostStatus.DRAFT, label: 'Draft' },
        { value: PostStatus.WAITING_APPROVAL, label: 'Waiting Approval' },
        { value: PostStatus.READY_TO_PUBLISH, label: 'Ready to Publish' },
        { value: PostStatus.PUBLISHED, label: 'Published' },
        { value: PostStatus.DECLINED, label: 'Declined' },
        { value: PostStatus.UNPUBLISHED, label: 'Unpublished' },
        { value: PostStatus.ARCHIVED, label: 'Archived' }
      ];
    }
    
    // Senior Editor can change status to Ready to Publish
    if (userRoles.includes('SENIOR_EDITOR')) {
      return [
        { value: PostStatus.DRAFT, label: 'Draft' },
        { value: PostStatus.WAITING_APPROVAL, label: 'Waiting Approval' },
        { value: PostStatus.READY_TO_PUBLISH, label: 'Ready to Publish' }
      ];
    }
    
    // Regular Editor - limited options
    // When creating new posts, they can only set Draft or Waiting Approval
    // When editing their own posts, they can only set Draft or Waiting Approval
    // Should not be able to edit posts they don't own
    if (userRoles.includes('EDITOR')) {
      if (!isEdit || isAuthor) {
        return [
          { value: PostStatus.DRAFT, label: 'Draft' },
          { value: PostStatus.WAITING_APPROVAL, label: 'Waiting Approval' }
        ];
      } else {
        // Editing someone else's post as Editor - shouldn't happen, but show current status only
        return [
          { value, label: getStatusLabel(value) }
        ];
      }
    }
    
    // Default fallback - show current status only
    return [
      { value, label: getStatusLabel(value) }
    ];
  };

  // Get status label
  const getStatusLabel = (status: PostStatus) => {
    switch (status) {
      case PostStatus.DRAFT: return 'Draft';
      case PostStatus.WAITING_APPROVAL: return 'Waiting Approval';
      case PostStatus.READY_TO_PUBLISH: return 'Ready to Publish';
      case PostStatus.PUBLISHED: return 'Published';
      case PostStatus.UNPUBLISHED: return 'Unpublished';
      case PostStatus.ARCHIVED: return 'Archived';
      case PostStatus.DECLINED: return 'Declined';
      default: return 'Unknown';
    }
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <div>
      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
        Status
      </label>
      <select
        id="status"
        name="status"
        value={value}
        onChange={onChange}
        className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
      >
        {availableStatuses.map(status => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  );
} 