'use client';

import { useEffect, useState } from 'react';
import { DataTable, Column } from '@/components/shared/data-table';
import { User } from '@prisma/client';

const columns: Column<User>[] = [
  { key: 'email', label: 'Email', sortable: true },
  { key: 'firstName', label: 'First Name', sortable: true },
  { key: 'lastName', label: 'Last Name', sortable: true },
  { key: 'createdAt', label: 'Created At', sortable: true },
  {
    key: 'isActive',
    label: 'Status',
    render: (value) => (value ? 'Active' : 'Inactive'),
  },
];

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (params: any) => {
    try {
      const response = await fetch(
        `/api/users?${new URLSearchParams(params).toString()}`
      );
      const json = await response.json();
      setData(json.data);
      setTotal(json.meta.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers({ page, limit });
  }, [page, limit]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSort={(key, order) => fetchUsers({ page, limit, sortBy: key, sortOrder: order })}
        onSearch={(search) => fetchUsers({ page: 1, limit, search })}
      />
    </div>
  );
} 