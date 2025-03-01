import React from 'react';
import Link from 'next/link';

export default function AdminFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} Your Company. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <Link href="/admin/help" className="text-sm text-gray-500 hover:text-gray-700">
              Help Center
            </Link>
            <Link href="/admin/docs" className="text-sm text-gray-500 hover:text-gray-700">
              Documentation
            </Link>
            <Link href="/admin/privacy" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy Policy
            </Link>
            <Link href="/admin/terms" className="text-sm text-gray-500 hover:text-gray-700">
              Terms of Service
            </Link>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <span className="text-sm text-gray-500 mr-2">Version 1.0.0</span>
            <div className="w-2 h-2 rounded-full bg-green-500" title="System Status: Online"></div>
          </div>
        </div>
      </div>
    </footer>
  );
} 