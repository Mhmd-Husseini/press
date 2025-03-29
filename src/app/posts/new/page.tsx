import CreatePostForm from '@/components/posts/CreatePostForm';

export const metadata = {
  title: 'Create a New Post',
  description: 'Share your ideas with the world by creating a new post'
};

export default function NewPostPage() {
  return (
    <main className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <CreatePostForm />
    </main>
  );
} 