import { getUserById, updateUser } from '@/app/actions/user';
import { notFound } from 'next/navigation';
import UserFormWrapper from './user-form-wrapper'

// This is a Server Component
export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const userId = resolvedParams.id;
  
  // Fetch user data on the server
  const { success, user, error } = await getUserById(userId);
  
  if (!success || !user) {
    notFound();
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit User</h1>
      
      {/* Client component for form handling */}
      <UserFormWrapper user={user} />
    </div>
  );
}