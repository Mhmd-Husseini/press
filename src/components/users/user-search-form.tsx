'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

type UserSearchFormProps = {
  initialSearch?: string;
  basePath: string;
};

export default function UserSearchForm({ initialSearch = '', basePath }: UserSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the new URL with the search parameter
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset page when searching
    params.set('page', '1');
    
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchTerm('');
    
    // Remove search param from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.set('page', '1');
    
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
      <div className="flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users by name or email..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Search
      </button>
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Clear
        </button>
      )}
    </form>
  );
} 