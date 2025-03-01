'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CategoryForm from '@/components/admin/categories/CategoryForm';
import PageHeader from '@/components/admin/PageHeader';
import { CategoryWithTranslations } from '@/lib/services/category.service';

export default function EditCategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<CategoryWithTranslations | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/admin/categories/${categoryId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch category: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCategory(data);
      } catch (err: any) {
        console.error('Error fetching category:', err);
        setError(err.message || 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="h-80 bg-gray-100 rounded w-full"></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error || 'Category not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const categoryName = category.translations?.[0]?.name || 'Unnamed Category';

  return (
    <>
      <PageHeader 
        title={`Edit Category: ${categoryName}`}
        description="Update your category information"
      />
      <div className="mt-6">
        <CategoryForm category={category} isEdit={true} />
      </div>
    </>
  );
} 