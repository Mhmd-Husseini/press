import { Suspense } from 'react';
import NewCategoryClient from './NewCategoryClient';

export const metadata = {
  title: 'Create Category | Admin Panel',
};

export default function CreateCategoryPage() {
  return (
    <Suspense fallback={<div>Loading category form...</div>}>
      <NewCategoryClient />
    </Suspense>
  );
} 