'use client';

import { getUserById, updateUser } from '@/app/actions/user';
import UserForm from '@/components/users/user-form';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export default function EditUserPage({ params }: { params: { id: string } }) {
  const userId = params.id;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit User</h1>
      
      <Suspense fallback={<div>Loading user information...</div>}>
        <EditUserForm userId={userId} />
      </Suspense>
    </div>
  );
}

async function EditUserForm({ userId }: { userId: string }) {
  const { success, user, error } = await getUserById(userId);
  
  if (!success || !user) {
    notFound();
  }
  
  return (
    <UserForm 
      user={user}
      onSubmit={updateUser}
      submitButtonText="Update User"
    />
  );
} 