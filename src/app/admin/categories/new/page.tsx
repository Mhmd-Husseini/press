import CategoryForm from '@/components/admin/categories/CategoryForm';
import PageHeader from '@/components/admin/PageHeader';

export const metadata = {
  title: 'Create Category | Admin Panel',
};

export default function CreateCategoryPage() {
  return (
    <>
      <PageHeader 
        title="Create Category" 
        description="Add a new content category to your site"
      />
      <div className="mt-6">
        <CategoryForm />
      </div>
    </>
  );
} 