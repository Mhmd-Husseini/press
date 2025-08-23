import { useState, useEffect } from 'react';

type CategoryName = {
  en: string;
  ar: string;
};

export type Category = {
  id: string;
  slug: string;
  name: CategoryName;
  description: string | null;
  locale: string;
  dir: string | null;
  children?: Category[]; // Optional children for hierarchical navigation
};

type CategoriesResponse = {
  categories: Category[];
};

export const useCategories = (locale = 'en') => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/categories?locale=${locale}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json() as CategoriesResponse;
        setCategories(data.categories);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [locale]);

  return { categories, loading, error };
}; 