'use client';

import React, { useEffect } from 'react';
import AdminHeader from '@/components/admin/Header';
import AdminFooter from '@/components/admin/Footer';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force English/LTR for admin panel
  useEffect(() => {
    // Set admin locale to English
    document.cookie = 'ADMIN_LOCALE=en; path=/admin; max-age=31536000';
    
    // Force LTR direction for admin
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
    document.body.classList.remove('rtl', 'font-arabic');
    document.body.classList.add('ltr');
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-gray-50" dir="ltr" lang="en">
        <AdminHeader />
        <main className="flex-grow p-6" dir="ltr">
            {children}
        </main>
        <AdminFooter />
      </div>
    </AuthProvider>
  );
} 