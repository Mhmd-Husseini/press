'use client';

import { useState } from 'react';
import { PostStatus } from '@prisma/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithRelations } from '@/lib/services/post.service';

interface EditorialWorkflowProps {
  post: PostWithRelations;
  onStatusChange: (newStatus: PostStatus, reason?: string) => Promise<void>;
  disabled?: boolean;
}

export default function EditorialWorkflow({ post, onStatusChange, disabled = false }: EditorialWorkflowProps) {
  const { user, hasPermission } = useAuth();
  const [isChanging, setIsChanging] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [statusChangeError, setStatusChangeError] = useState<string | null>(null);

  const canPublish = hasPermission('publish_content');
  const canApprove = hasPermission('approve_content');
  const canDecline = hasPermission('decline_content');
  const canUnpublish = hasPermission('unpublish_content');
  const isEditor = hasPermission('edit_content') || hasPermission('edit_own_content');
  const isOwnPost = user && post.authorId === user.id;
  const canEditPost = hasPermission('edit_content') || (hasPermission('edit_own_content') && isOwnPost);

  // Only allow status changes if the user has appropriate permissions
  const canChangeStatus = !disabled && ((isEditor && isOwnPost) || canApprove || canPublish || canDecline);

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case PostStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case PostStatus.WAITING_APPROVAL:
        return 'bg-yellow-100 text-yellow-800';
      case PostStatus.READY_TO_PUBLISH:
        return 'bg-green-100 text-green-800';
      case PostStatus.PUBLISHED:
        return 'bg-blue-100 text-blue-800';
      case PostStatus.UNPUBLISHED:
        return 'bg-orange-100 text-orange-800';
      case PostStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      case PostStatus.DECLINED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: PostStatus) => {
    switch (status) {
      case PostStatus.DRAFT:
        return 'Draft';
      case PostStatus.WAITING_APPROVAL:
        return 'Waiting for Approval';
      case PostStatus.READY_TO_PUBLISH:
        return 'Ready to Publish';
      case PostStatus.PUBLISHED:
        return 'Published';
      case PostStatus.UNPUBLISHED:
        return 'Unpublished';
      case PostStatus.ARCHIVED:
        return 'Archived';
      case PostStatus.DECLINED:
        return 'Declined';
      default:
        return status;
    }
  };

  const getStatusActions = () => {
    const actions = [];

    // Check current status and provide appropriate action buttons
    switch (post.status) {
      case PostStatus.DRAFT:
        if (canEditPost) {
          actions.push({
            label: 'Submit for Approval',
            status: PostStatus.WAITING_APPROVAL,
            isPrimary: true,
            color: 'bg-yellow-600 hover:bg-yellow-700'
          });
        }
        break;

      case PostStatus.WAITING_APPROVAL:
        if (canApprove) {
          actions.push({
            label: 'Approve',
            status: PostStatus.READY_TO_PUBLISH,
            isPrimary: true,
            color: 'bg-green-600 hover:bg-green-700'
          });
          actions.push({
            label: 'Decline',
            action: () => setShowDeclineForm(true),
            isPrimary: false,
            color: 'bg-red-600 hover:bg-red-700'
          });
        }
        if (canEditPost) {
          actions.push({
            label: 'Withdraw',
            status: PostStatus.DRAFT,
            isPrimary: false,
            color: 'bg-gray-600 hover:bg-gray-700'
          });
        }
        break;

      case PostStatus.READY_TO_PUBLISH:
        if (canPublish) {
          actions.push({
            label: 'Publish',
            status: PostStatus.PUBLISHED,
            isPrimary: true,
            color: 'bg-blue-600 hover:bg-blue-700'
          });
        }
        if (canApprove) {
          actions.push({
            label: 'Send Back for Edits',
            status: PostStatus.DRAFT,
            isPrimary: false,
            color: 'bg-gray-600 hover:bg-gray-700'
          });
        }
        break;

      case PostStatus.PUBLISHED:
        if (canUnpublish) {
          actions.push({
            label: 'Unpublish',
            status: PostStatus.UNPUBLISHED,
            isPrimary: false,
            color: 'bg-orange-600 hover:bg-orange-700'
          });
          actions.push({
            label: 'Archive',
            status: PostStatus.ARCHIVED,
            isPrimary: false,
            color: 'bg-gray-600 hover:bg-gray-700'
          });
        }
        break;

      case PostStatus.UNPUBLISHED:
        if (canPublish) {
          actions.push({
            label: 'Publish Again',
            status: PostStatus.PUBLISHED,
            isPrimary: true,
            color: 'bg-blue-600 hover:bg-blue-700'
          });
          actions.push({
            label: 'Archive',
            status: PostStatus.ARCHIVED,
            isPrimary: false,
            color: 'bg-gray-600 hover:bg-gray-700'
          });
        }
        if (canEditPost) {
          actions.push({
            label: 'Edit',
            status: PostStatus.DRAFT,
            isPrimary: false,
            color: 'bg-gray-600 hover:bg-gray-700'
          });
        }
        break;

      case PostStatus.ARCHIVED:
        if (canPublish) {
          actions.push({
            label: 'Restore',
            status: PostStatus.DRAFT,
            isPrimary: false,
            color: 'bg-gray-600 hover:bg-gray-700'
          });
        }
        break;

      case PostStatus.DECLINED:
        if (canEditPost) {
          actions.push({
            label: 'Revise and Resubmit',
            status: PostStatus.DRAFT,
            isPrimary: true,
            color: 'bg-gray-600 hover:bg-gray-700'
          });
        }
        break;
    }

    return actions;
  };

  const handleStatusChange = async (newStatus: PostStatus) => {
    if (disabled || isChanging) return;

    try {
      setIsChanging(true);
      setStatusChangeError(null);
      await onStatusChange(newStatus);
    } catch (error) {
      console.error('Error changing status:', error);
      setStatusChangeError('Failed to change status. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  const handleDeclineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled || isChanging) return;

    try {
      setIsChanging(true);
      setStatusChangeError(null);
      await onStatusChange(PostStatus.DECLINED, declineReason);
      setShowDeclineForm(false);
      setDeclineReason('');
    } catch (error) {
      console.error('Error declining post:', error);
      setStatusChangeError('Failed to decline post. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  const actions = getStatusActions();

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium mb-3">Editorial Status</h3>
      
      <div className="flex flex-wrap items-center mb-4">
        <span className="mr-2 font-medium">Current Status:</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
          {getStatusLabel(post.status)}
        </span>
      </div>
      
      {post.status === PostStatus.DECLINED && post.declineReason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md">
          <p className="text-sm font-medium text-red-700">Decline Reason:</p>
          <p className="text-sm text-red-700">{post.declineReason}</p>
        </div>
      )}
      
      {post.status === PostStatus.WAITING_APPROVAL && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
          <p className="text-sm text-yellow-700">
            This post is awaiting approval from a senior editor.
          </p>
        </div>
      )}
      
      {post.status === PostStatus.READY_TO_PUBLISH && (
        <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md">
          <p className="text-sm text-green-700">
            This post has been approved and is ready to be published.
          </p>
        </div>
      )}
      
      {showDeclineForm ? (
        <form onSubmit={handleDeclineSubmit} className="mb-4">
          <div className="mb-3">
            <label htmlFor="decline-reason" className="block text-sm font-medium text-gray-700">
              Reason for Declining
            </label>
            <textarea
              id="decline-reason"
              rows={3}
              required
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Provide a reason for declining..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowDeclineForm(false)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isChanging}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              disabled={isChanging}
            >
              {isChanging ? 'Declining...' : 'Decline Post'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action ? action.action : () => handleStatusChange(action.status!)}
              disabled={isChanging || disabled}
              className={`px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white ${
                action.color
              } transition-colors ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      
      {statusChangeError && (
        <div className="mt-2 text-sm text-red-600">
          {statusChangeError}
        </div>
      )}
      
      {post.revisionHistory && post.revisionHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Latest Change</h4>
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">
                  {new Date(post.revisionHistory[0].createdAt).toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">
                    {post.revisionHistory[0].changedBy.firstName || post.revisionHistory[0].changedBy.email}
                  </span>{' '}
                  {post.revisionHistory[0].changeNote}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.revisionHistory[0].status)}`}>
                {getStatusLabel(post.revisionHistory[0].status)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 