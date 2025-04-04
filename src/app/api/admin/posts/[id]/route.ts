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

    // Get user from request
    const user = await authService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    // Get locale parameter from query if present
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');

    const post = await postService.getById(params.id, locale || undefined);
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check role-based permissions
    const userRoles = user.roles || [];
    const isAdmin = userRoles.some(r => r.role?.name === 'SUPER_ADMIN' || 
                                    r.role?.name === 'EDITOR_IN_CHIEF' || 
                                    r.role?.name === 'EDITORIAL');
    const isSeniorEditor = userRoles.some(r => r.role?.name === 'SENIOR_EDITOR');
    const isEditor = userRoles.some(r => r.role?.name === 'EDITOR');
    const isAuthor = post.authorId === user.id;
    
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

    // Get user from request
    const user = await authService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    // Get the current post to check ownership
    const currentPost = await postService.getById(params.id);
    if (!currentPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Parse request body
    const data = await request.json();
    
    // Check role-based permissions
    const userRoles = user.roles || [];
    const isAdmin = userRoles.some(r => r.role?.name === 'SUPER_ADMIN' || 
                                    r.role?.name === 'EDITOR_IN_CHIEF' || 
                                    r.role?.name === 'EDITORIAL');
    const isSeniorEditor = userRoles.some(r => r.role?.name === 'SENIOR_EDITOR');
    const isEditor = userRoles.some(r => r.role?.name === 'EDITOR');
    const isAuthor = currentPost.authorId === user.id;
    
    // Editors can only edit their own posts
    if (isEditor && !isAdmin && !isSeniorEditor && !isAuthor) {
      return NextResponse.json({ 
        error: 'As an Editor, you can only edit your own posts' 
      }, { status: 403 });
    }
    
    // Check status change permissions
    if (data.status) {
      // If status is being changed to PUBLISHED or DECLINED
      if (data.status === 'PUBLISHED' || data.status === 'DECLINED') {
        // Only admins can publish or decline
        if (!isAdmin) {
          return NextResponse.json({ 
            error: 'You do not have permission to publish or decline content' 
          }, { status: 403 });
        }
        
        // Set the publisher or decliner ID
        if (data.status === 'PUBLISHED') {
          data.publishedById = user.id;
          data.publishedAt = new Date();
        } else if (data.status === 'DECLINED') {
          data.declinedById = user.id;
        }
      }
      
      // If status is being changed to READY_TO_PUBLISH
      else if (data.status === 'READY_TO_PUBLISH') {
        // Only admins and senior editors can mark as ready to publish
        if (!isAdmin && !isSeniorEditor) {
          return NextResponse.json({ 
            error: 'You do not have permission to mark content as ready to publish' 
          }, { status: 403 });
        }
        
        // Set the approver ID
        data.approvedById = user.id;
      }
      
      // Editors can only set to DRAFT or WAITING_APPROVAL
      else if (isEditor && !isAdmin && !isSeniorEditor) {
        if (data.status !== 'DRAFT' && data.status !== 'WAITING_APPROVAL') {
          return NextResponse.json({ 
            error: 'As an Editor, you can only set status to Draft or Waiting Approval' 
          }, { status: 403 });
        }
      }
      
      // Set status update timestamp
      data.statusUpdatedAt = new Date();
    }

    // Add the current user as the updater
    data.updatedById = user.id;

    // Ensure author name fields are properly handled
    // If authorName/authorNameArabic is empty string, set to null to use default
    if (data.authorName === '') {
      data.authorName = null;
    }
    
    if (data.authorNameArabic === '') {
      data.authorNameArabic = null;
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