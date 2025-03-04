'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocale, setCurrentLocale] = useState('en');

  useEffect(() => {
    // Get current locale from cookie
    const locale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'en';
    
    setCurrentLocale(locale);
    
    // Apply RTL direction globally
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.body.className = locale === 'ar' ? 'rtl' : 'ltr';
    
    // Add RTL styles if needed
    if (locale === 'ar') {
      document.body.classList.add('font-arabic');
    } else {
      document.body.classList.remove('font-arabic');
    }
  }, []);

  return (
    <div className={`flex flex-col min-h-screen ${currentLocale === 'ar' ? 'rtl text-right' : 'ltr text-left'}`}>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout; 