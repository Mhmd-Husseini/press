'use client';

import UserForm from '@/components/users/user-form';
import { updateUser } from '@/app/actions/user';
import RoleGuard from '@/components/shared/RoleGuard';
import Link from 'next/link';

export default function UserFormWrapper({ user }: { user: any }) {
  // Unauthorized access message
  const unauthorizedFallback = (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
      <h3 className="text-lg font-medium">Access Denied</h3>
      <p className="mt-2">You don't have permission to edit users.</p>
      <Link href={`/admin/users/${user.id}`} className="mt-4 inline-block text-blue-600 hover:underline">
        Return to User Details
      </Link>
    </div>
  );

  return (
    <RoleGuard
      roles={['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL']}
      fallback={unauthorizedFallback}
    >
      <UserForm 
        user={user}
        onSubmit={updateUser}
        submitButtonText="Update User"
      />
    </RoleGuard>
  );
}