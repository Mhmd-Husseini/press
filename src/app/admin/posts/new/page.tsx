import PageHeader from '@/components/admin/PageHeader';
import PostForm from '@/components/admin/posts/PostForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Create New Post | Admin Dashboard',
  description: 'Create a new post with multilingual content'
};

export default function NewPostPage() {
  return (
    <div className="py-6 space-y-6">
      <PageHeader 
        title="Create New Post" 
        description="Create a new post with multilingual content"
        actions={[
          {
            label: 'Back to Posts',
            href: '/admin/content',
            variant: 'secondary'
          }
        ]}
      />
      
      <Suspense fallback={<div>Loading post form...</div>}>
        <PostForm />
      </Suspense>
    </div>
  );
} 