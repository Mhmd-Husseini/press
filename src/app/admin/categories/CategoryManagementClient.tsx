'use client';

import CategoryList from '@/components/admin/categories/CategoryList';
import PageHeader from '@/components/admin/PageHeader';
import RoleGuard from '@/components/shared/RoleGuard';
import Link from 'next/link';

export default function CategoryManagementClient() {
  // Unauthorized access message
  const unauthorizedFallback = (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
      <h3 className="text-lg font-medium">Access Denied</h3>
      <p className="mt-2">You don't have permission to view categories.</p>
      <Link href="/admin" className="mt-4 inline-block text-blue-600 hover:underline">
        Return to Admin Dashboard
      </Link>
    </div>
  );

  return (
    <RoleGuard 
      roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL', 'SENIOR_EDITOR', 'EDITOR']}
      fallback={unauthorizedFallback}
    >
      <RoleGuard 
        roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL']}
      >
        <PageHeader 
          title="Categories" 
          description="Manage your content categories"
          buttonText="Add Category"
          buttonHref="/admin/categories/new"
        />
      </RoleGuard>
      <RoleGuard 
        roles={['SENIOR_EDITOR', 'EDITOR']}
      >
        <PageHeader 
          title="Categories" 
          description="View content categories"
        />
      </RoleGuard>
      <div className="mt-6">
        <CategoryList />
      </div>
    </RoleGuard>
  );
} 