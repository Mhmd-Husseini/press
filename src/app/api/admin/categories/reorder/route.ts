import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/services/category.service';
import { AuthService } from '@/lib/services/auth.service';

const categoryService = new CategoryService();
const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to update categories
    const canUpdateCategories = await authService.hasPermission(request, 'update_categories');
    if (!canUpdateCategories) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const data = await request.json();
    
    if (!data.categoryIds || !Array.isArray(data.categoryIds)) {
      return NextResponse.json({ error: 'Invalid request format. categoryIds array is required.' }, { status: 400 });
    }

    // Reorder categories
    await categoryService.reorder(data.categoryIds);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to reorder categories' }, { status: 400 });
  }
} 