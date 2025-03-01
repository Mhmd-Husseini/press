'use client';

import { createUser } from '@/app/actions/user';
import UserForm from '@/components/users/user-form';
import { useRouter } from 'next/navigation';

export default function NewUserPage() {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New User</h1>
      
      <UserForm 
        onSubmit={createUser}
        submitButtonText="Create User"
      />
    </div>
  );
} 