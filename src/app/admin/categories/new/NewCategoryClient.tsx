'use client';

import CategoryForm from '@/components/admin/categories/CategoryForm';
import PageHeader from '@/components/admin/PageHeader';
import RoleGuard from '@/components/shared/RoleGuard';
import Link from 'next/link';

export default function NewCategoryClient() {
  // Unauthorized access message
  const unauthorizedFallback = (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
      <h3 className="text-lg font-medium">Access Denied</h3>
      <p className="mt-2">You don't have permission to create new categories.</p>
      <Link href="/admin/categories" className="mt-4 inline-block text-blue-600 hover:underline">
        Return to Categories
      </Link>
    </div>
  );

  return (
    <RoleGuard
      roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL']}
      fallback={unauthorizedFallback}
    >
      <PageHeader 
        title="Create Category" 
        description="Add a new content category to your site"
      />
      <div className="mt-6">
        <CategoryForm />
      </div>
    </RoleGuard>
  );
} 