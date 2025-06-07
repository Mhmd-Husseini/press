import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/services/category.service';
import { AuthService } from '@/lib/services/auth.service';

const categoryService = new CategoryService();
const authService = new AuthService();

export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view categories
    const canViewCategories = await authService.hasPermission(request, 'view_categories');
    if (!canViewCategories) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    const flat = searchParams.get('flat') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // If requesting flat categories (for dropdown/select), return all without pagination
    if (flat) {
      const categories = await categoryService.getAllFlat();
      return NextResponse.json(categories);
    }

    // For paginated results
    const result = await categoryService.getPaginated({
      locale: locale || undefined,
      page,
      limit,
      search
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create categories
    const canCreateCategories = await authService.hasPermission(request, 'create_categories');
    if (!canCreateCategories) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const data = await request.json();

    // Create new category
    const category = await categoryService.create(data);

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 400 });
  }
} 