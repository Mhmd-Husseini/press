'use client';

import UserForm from '@/components/users/user-form';
import { updateUser } from '@/app/actions/user';

export default function UserFormWrapper({ user }: { user: any }) {
  return (
    <UserForm 
      user={user}
      onSubmit={updateUser}
      submitButtonText="Update User"
    />
  );
}