'use client';

import { createUser } from '@/app/actions/user';
import UserForm from '@/components/users/user-form';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/shared/RoleGuard';
import Link from 'next/link';

export default function NewUserPage() {
  const router = useRouter();
  
  // Unauthorized access message
  const unauthorizedFallback = (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
      <h3 className="text-lg font-medium">Access Denied</h3>
      <p className="mt-2">You don't have permission to create new users.</p>
      <Link href="/admin/users" className="mt-4 inline-block text-blue-600 hover:underline">
        Return to User Management
      </Link>
    </div>
  );
  
  return (
    <RoleGuard
      roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL']}
      fallback={unauthorizedFallback}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Create New User</h1>
        
        <UserForm 
          onSubmit={createUser}
          submitButtonText="Create User"
        />
      </div>
    </RoleGuard>
  );
} 