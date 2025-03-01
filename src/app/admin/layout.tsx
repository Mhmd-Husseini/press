import React from 'react';
import AdminHeader from '@/components/admin/Header';
import AdminFooter from '@/components/admin/Footer';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard for managing the application',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-grow p-6">{children}</main>
      <AdminFooter />
    </div>
  );
} 