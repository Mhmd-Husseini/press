import { Suspense } from 'react';
import CategoryManagementClient from './CategoryManagementClient';

export const metadata = {
  title: 'Categories Management | Admin Panel',
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div>Loading categories...</div>}>
      <CategoryManagementClient />
    </Suspense>
  );
} 