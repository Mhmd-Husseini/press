'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '@/contexts/AuthContext';
import { CategoryWithTranslations } from '@/lib/services/category.service';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { PencilIcon, TrashIcon, ViewColumnsIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import PermissionGuard from '@/components/shared/PermissionGuard';

export default function CategoryList() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryWithTranslations[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<string>('en');

  useEffect(() => {
    fetchCategories();
  }, [locale]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/categories?locale=${locale}`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please try again.');
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      // Refresh categories
      fetchCategories();
    } catch (error: any) {
      alert(error.message || 'An error occurred while deleting the category');
    }
  };

  const handleDragEnd = async (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    // If the item was dropped in a different position
    if (result.source.index !== result.destination.index) {
      const items = Array.from(categories);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Update local state for immediate feedback
      setCategories(items);

      // Send updated order to server
      try {
        const categoryIds = items.map(item => item.id);
        const response = await fetch('/api/admin/categories/reorder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ categoryIds }),
        });

        if (!response.ok) {
          throw new Error('Failed to update category order');
        }
      } catch (error) {
        console.error('Error updating category order:', error);
        // Revert to original order if failed
        fetchCategories();
      }
    }
  };

  const renderCategories = (categoryList: CategoryWithTranslations[], level = 0) => {
    return categoryList.map((category, index) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories[category.id] || false;
      const categoryName = category.translations[0]?.name || 'Unnamed Category';

      return (
        <div key={category.id} className="mb-1">
          <div
            className={`flex items-center p-3 rounded-md ${
              level === 0 ? 'bg-white border border-gray-200' : 'bg-gray-50 ml-6'
            } hover:bg-gray-100`}
          >
            {/* Expand/collapse icon for categories with children */}
            <div className="mr-2 w-5">
              {hasChildren && (
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            
            {/* Category name */}
            <div className="flex-grow font-medium">
              {categoryName}
              {category.translations.length > 1 && (
                <span className="ml-2 text-xs text-gray-500">
                  ({category.translations.length} translations)
                </span>
              )}
            </div>
            
            {/* Category actions */}
            <div className="flex items-center space-x-2">
              {/* View posts in category */}
              <PermissionGuard permissions="view_content">
                <Link 
                  href={`/admin/content?category=${category.id}`}
                  className="text-gray-500 hover:text-gray-700"
                  title="View posts in category"
                >
                  <ViewColumnsIcon className="h-5 w-5" />
                </Link>
              </PermissionGuard>
              
              {/* Add subcategory */}
              <PermissionGuard permissions="create_categories">
                <Link 
                  href={`/admin/categories/new?parent=${category.id}`}
                  className="text-gray-500 hover:text-gray-700"
                  title="Add subcategory"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                </Link>
              </PermissionGuard>
              
              {/* Edit category */}
              <PermissionGuard permissions="update_categories">
                <Link 
                  href={`/admin/categories/${category.id}/edit`}
                  className="text-gray-500 hover:text-gray-700"
                  title="Edit category"
                >
                  <PencilIcon className="h-5 w-5" />
                </Link>
              </PermissionGuard>
              
              {/* Delete category */}
              <PermissionGuard permissions="delete_categories">
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete category"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </PermissionGuard>
            </div>
          </div>
          
          {/* Render children if expanded */}
          {hasChildren && isExpanded && (
            <div className="pl-4 ml-2 border-l border-gray-200">
              {renderCategories(category.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700">
        <p>{error}</p>
        <button 
          onClick={fetchCategories} 
          className="mt-2 px-4 py-1 bg-red-100 rounded hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white p-8 rounded-md text-center">
        <h3 className="text-lg font-medium mb-2">No categories found</h3>
        <p className="text-gray-500 mb-4">Get started by creating your first category</p>
        <PermissionGuard permissions="create_categories">
          <Link
            href="/admin/categories/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Create Category
          </Link>
        </PermissionGuard>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">All Categories</h2>
        <div className="flex items-center space-x-4">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
          <button
            onClick={fetchCategories}
            className="p-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            Refresh
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {categories.map((category, index) => (
                <Draggable key={category.id} draggableId={category.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <div key={category.id} className="mb-1">
                        <div
                          className="flex items-center p-3 rounded-md bg-white border border-gray-200 hover:bg-gray-100"
                        >
                          {/* Expand/collapse icon for categories with children */}
                          <div className="mr-2 w-5">
                            {category.children && category.children.length > 0 && (
                              <button
                                onClick={() => toggleCategory(category.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {expandedCategories[category.id] ? (
                                  <ChevronDownIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                          
                          {/* Category name */}
                          <div className="flex-grow font-medium">
                            {category.translations[0]?.name || 'Unnamed Category'}
                            {category.translations.length > 1 && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({category.translations.length} translations)
                              </span>
                            )}
                          </div>
                          
                          {/* Category actions */}
                          <div className="flex items-center space-x-2">
                            {/* View posts in category */}
                            <PermissionGuard permissions="view_content">
                              <Link 
                                href={`/admin/content?category=${category.id}`}
                                className="text-gray-500 hover:text-gray-700"
                                title="View posts in category"
                              >
                                <ViewColumnsIcon className="h-5 w-5" />
                              </Link>
                            </PermissionGuard>
                            
                            {/* Add subcategory */}
                            <PermissionGuard permissions="create_categories">
                              <Link 
                                href={`/admin/categories/new?parent=${category.id}`}
                                className="text-gray-500 hover:text-gray-700"
                                title="Add subcategory"
                              >
                                <PlusCircleIcon className="h-5 w-5" />
                              </Link>
                            </PermissionGuard>
                            
                            {/* Edit category */}
                            <PermissionGuard permissions="update_categories">
                              <Link 
                                href={`/admin/categories/${category.id}/edit`}
                                className="text-gray-500 hover:text-gray-700"
                                title="Edit category"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </Link>
                            </PermissionGuard>
                            
                            {/* Delete category */}
                            <PermissionGuard permissions="delete_categories">
                              <button
                                onClick={() => handleDelete(category.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete category"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </PermissionGuard>
                          </div>
                        </div>
                        
                        {/* Render children if expanded */}
                        {category.children && category.children.length > 0 && expandedCategories[category.id] && (
                          <div className="pl-4 ml-2 border-l border-gray-200">
                            {renderCategories(category.children, 1)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
} 