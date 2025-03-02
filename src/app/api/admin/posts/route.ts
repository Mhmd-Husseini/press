import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/lib/services/post.service';
import { AuthService } from '@/lib/services/auth.service';
import { PostStatus } from '@prisma/client';

const postService = new PostService();
const authService = new AuthService();

export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view posts
    const canViewContent = await authService.hasPermission(request, 'view_content');
    if (!canViewContent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PostStatus | null;
    const locale = searchParams.get('locale');
    const categoryId = searchParams.get('category');
    const authorId = searchParams.get('author');
    const featured = searchParams.has('featured') ? searchParams.get('featured') === 'true' : undefined;
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const page = searchParams.has('page') ? parseInt(searchParams.get('page') || '1', 10) : 1;
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit') || '10', 10) : 10;

    // Get posts with the specified filters
    const result = await postService.getAll({
      status,
      locale: locale || undefined,
      categoryId: categoryId || undefined,
      authorId: authorId || undefined,
      featured,
      tag: tag || undefined,
      search: search || undefined,
      page,
      limit
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create posts
    const canCreateContent = await authService.hasPermission(request, 'create_content');
    if (!canCreateContent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get user from request
    const user = await authService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data = await request.json();

    // Add the current user as the author if not specified
    if (!data.authorId) {
      data.authorId = user.id;
    }

    // Create new post
    const post = await postService.create(data);

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: 400 });
  }
} 