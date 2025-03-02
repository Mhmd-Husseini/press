import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/lib/services/post.service';
import { AuthService } from '@/lib/services/auth.service';

const postService = new PostService();
const authService = new AuthService();

export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view content
    const canViewContent = await authService.hasPermission(request, 'view_content');
    if (!canViewContent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tags = await postService.getTags();
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create content
    const canCreateContent = await authService.hasPermission(request, 'create_content');
    if (!canCreateContent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Create new tag
    const tag = await postService.createTag(data.name, data.nameArabic);

    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: error.message || 'Failed to create tag' }, { status: 400 });
  }
} 