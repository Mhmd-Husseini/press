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
      status: status || undefined,
      locale: locale || undefined,
      categoryId: categoryId || undefined,
      authorId: authorId || undefined,
      page: page || undefined,
      limit: limit || undefined,
      search: search || undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting post creation process...');
    
    // Check if user has permission to create posts
    console.log('Checking user permission for create_content...');
    const canCreateContent = await authService.hasPermission(request, 'create_content');
    if (!canCreateContent) {
      console.log('Permission denied: create_content');
      return NextResponse.json({ error: 'Unauthorized - No permission to create content' }, { status: 403 });
    }
    console.log('Permission granted: create_content');

    // Get user from request
    console.log('Getting user from request...');
    const user = await authService.getUserFromRequest(request);
    if (!user) {
      console.log('Failed to get user from request');
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }
    console.log('User found:', user.id, user.email);

    // Parse request body
    const data = await request.json();
    console.log('Parsed request data:', JSON.stringify(data, null, 2));

    // Add the current user as the author if not specified
    if (!data.authorId) {
      data.authorId = user.id;
      console.log('Using current user as author:', user.id);
    }
    
    // Set default author name if not provided or empty
    if (!data.authorName || data.authorName.trim() === '') {
      if (user.firstName) {
        data.authorName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        console.log('Using default author name:', data.authorName);
      } else {
        data.authorName = null; // Set to null if no name components available
      }
    }
    
    // Set default Arabic author name if not provided or empty
    if (!data.authorNameArabic || data.authorNameArabic.trim() === '') {
      if (user.firstNameArabic) {
        data.authorNameArabic = `${user.firstNameArabic || ''} ${user.lastNameArabic || ''}`.trim();
        console.log('Using default Arabic author name:', data.authorNameArabic);
      } else {
        data.authorNameArabic = null; // Set to null if no name components available
      }
    }
    
    // Set creator and updater
    data.createdById = user.id;
    data.updatedById = user.id;
    console.log('Setting creator and updater to current user:', user.id);

    // Create new post
    console.log('Creating post...');
    const post = await postService.create(data);
    console.log('Post created successfully with ID:', post.id);

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create post',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 400 });
  }
} 