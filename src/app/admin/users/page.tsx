import { getUsers } from '@/app/actions/user';
import Link from 'next/link';
import UserTable from '@/components/users/user-table';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = await Promise.resolve(searchParams);
  
  const pageParam = params.page;
  const limitParam = params.limit;
  const searchParam = params.search;
  
  const page = typeof pageParam === 'string' ? parseInt(pageParam) : 1;
  const limit = typeof limitParam === 'string' ? parseInt(limitParam) : 10;
  const search = typeof searchParam === 'string' ? searchParam : '';

  const { success, users, meta, error } = await getUsers(page, limit, search);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link
          href="/admin/users/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New User
        </Link>
      </div>

      {success ? (
        <>
          {users && users.length > 0 ? (
            <UserTable 
              users={users} 
              meta={meta} 
              basePath="/admin/users" 
            />
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-gray-500">
                {search ? `No users match "${search}"` : 'There are no users in the system yet.'}
              </p>
              {search && (
                <Link
                  href="/admin/users"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >
                  Clear search
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Error loading users: {error}</p>
        </div>
      )}
    </div>
  );
} 