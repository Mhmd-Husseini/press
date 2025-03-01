import { getUsers } from '@/app/actions/user';
import Link from 'next/link';
import UserSearchForm from '@/components/users/user-search-form';
import UserTable from '@/components/users/user-table';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageParam = searchParams.page;
  const limitParam = searchParams.limit;
  const searchParam = searchParams.search;
  
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

      <UserSearchForm initialSearch={search} basePath="/admin/users" />

      {success ? (
        <>
          {users && users.length > 0 ? (
            <>
              <UserTable users={users} />
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Page {page} of {meta?.totalPages || 1}
                </div>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/admin/users?page=${page - 1}${search ? `&search=${search}` : ''}`}
                      className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Previous
                    </Link>
                  )}
                  {meta && page < meta.totalPages && (
                    <Link
                      href={`/admin/users?page=${page + 1}${search ? `&search=${search}` : ''}`}
                      className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            </>
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