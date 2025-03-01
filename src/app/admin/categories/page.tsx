import CategoryList from '@/components/admin/categories/CategoryList';
import PageHeader from '@/components/admin/PageHeader';

export const metadata = {
  title: 'Categories Management | Admin Panel',
};

export default function CategoriesPage() {
  return (
    <>
      <PageHeader 
        title="Categories" 
        description="Manage your content categories"
        buttonText="Add Category"
        buttonHref="/admin/categories/new"
        buttonPermission="create_categories"
      />
      <div className="mt-6">
        <CategoryList />
      </div>
    </>
  );
} 