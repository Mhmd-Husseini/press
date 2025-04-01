// Server component
import { Suspense } from 'react';
import ContentPageClient from './page-client';

export const metadata = {
  title: 'Content Management | Admin Dashboard',
  description: 'Manage all your posts and articles',
};

export default function ContentPage() {
  return (
    <Suspense fallback={<div>Loading content management...</div>}>
      <ContentPageClient />
    </Suspense>
  );
} 