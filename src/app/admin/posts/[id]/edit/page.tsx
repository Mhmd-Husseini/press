'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/admin/PageHeader';
import PostForm from '@/components/admin/posts/PostForm';
import Skeleton from '@/components/shared/Skeleton';
import ErrorMessage from '@/components/shared/ErrorMessage';
import PostEditGuard from '@/components/admin/posts/PostEditGuard';
import PostLockGuard from '@/components/admin/posts/PostLockGuard';
import { PostWithRelations } from '@/lib/services/post.service';

export default function EditPostPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/admin/posts/${postId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Post not found');
          } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch post');
          }
        }
        
        const data = await response.json();
        setPost(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching the post');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [postId]);

  return (
    <div className="py-6 space-y-6">
      <PageHeader 
        title="Edit Post" 
        description="Update an existing post"
        actions={[
          {
            label: 'Back to Posts',
            href: '/admin/content',
            variant: 'secondary'
          }
        ]}
      />
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <PostEditGuard authorId={post?.authorId || undefined} postId={post?.id}>
          <PostLockGuard postId={postId}>
            <PostForm post={post || undefined} isEdit={true} />
          </PostLockGuard>
        </PostEditGuard>
      )}
    </div>
  );
} 