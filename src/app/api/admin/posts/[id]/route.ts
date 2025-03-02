import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/lib/services/post.service';
import { AuthService } from '@/lib/services/auth.service';

const postService = new PostService();
const authService = new AuthService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to view posts
    const canViewContent = await authService.hasPermission(request, 'view_content');
    if (!canViewContent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get locale parameter from query if present
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');

    const post = await postService.getById(params.id, locale || undefined);
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to update posts
    const canUpdateContent = await authService.hasPermission(request, 'update_content');
    if (!canUpdateContent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const data = await request.json();

    // Check if the user is trying to publish the post
    if (data.status === 'PUBLISHED') {
      // Check if user has permission to publish posts
      const canPublishContent = await authService.hasPermission(request, 'publish_content');
      if (!canPublishContent) {
        return NextResponse.json({ error: 'You do not have permission to publish content' }, { status: 403 });
      }
    }

    // Update post
    const post = await postService.update(params.id, data);

    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: error.message || 'Failed to update post' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to delete posts
    const canDeleteContent = await authService.hasPermission(request, 'delete_content');
    if (!canDeleteContent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get hard delete parameter (default to soft delete)
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Delete post
    if (hardDelete) {
      // Check if user has permission to hard delete posts
      const canHardDeleteContent = await authService.hasPermission(request, 'hard_delete_content');
      if (!canHardDeleteContent) {
        return NextResponse.json({ error: 'You do not have permission to permanently delete content' }, { status: 403 });
      }

      await postService.hardDelete(params.id);
    } else {
      await postService.softDelete(params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete post' }, { status: 400 });
  }
} 