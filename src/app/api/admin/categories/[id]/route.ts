import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/services/category.service';
import { AuthService } from '@/lib/services/auth.service';

const categoryService = new CategoryService();
const authService = new AuthService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to view categories
    const canViewCategories = await authService.hasPermission(request, 'view_categories');
    if (!canViewCategories) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const category = await categoryService.getById(params.id);
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to update categories
    const canUpdateCategories = await authService.hasPermission(request, 'update_categories');
    if (!canUpdateCategories) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const data = await request.json();

    // Update category
    const category = await categoryService.update(params.id, data);

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to delete categories
    const canDeleteCategories = await authService.hasPermission(request, 'delete_categories');
    if (!canDeleteCategories) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get hard delete parameter (default to soft delete)
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Delete category
    if (hardDelete) {
      await categoryService.hardDelete(params.id);
    } else {
      await categoryService.softDelete(params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 400 });
  }
} 