import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PostStatus } from '@prisma/client';
import { PostService } from '@/lib/services/post.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the post ID from the URL
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { status, reason } = body;
    
    if (!status || !Object.values(PostStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Get user roles and permissions
    const userRoles = (session.user as any).roles || [];
    const userPermissions = (session.user as any).permissions || [];
    
    // Check permissions based on the requested status change
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN') || 
                         userRoles.includes('EDITOR_IN_CHIEF') || 
                         userRoles.includes('EDITORIAL') ||
                         userRoles.includes('SENIOR_EDITOR');
                         
    const canPublish = isSuperAdmin || userPermissions.includes('publish_content');
    const canApprove = isSuperAdmin || userPermissions.includes('approve_content');
    const canDecline = isSuperAdmin || userPermissions.includes('decline_content');
    const canUnpublish = isSuperAdmin || userPermissions.includes('unpublish_content');
    const canEdit = isSuperAdmin || userPermissions.includes('edit_content');
    
    // Initialize post service
    const postService = new PostService();
    
    // Get the post to check ownership
    const post = await postService.getById(id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Check if user can edit own content only and is not the author
    if (
      !isSuperAdmin && 
      !canEdit && 
      userPermissions.includes('edit_own_content') && 
      post.authorId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'You can only update your own posts' },
        { status: 403 }
      );
    }
    
    // Check permissions based on the status change
    switch (status) {
      case PostStatus.PUBLISHED:
        if (!canPublish) {
          return NextResponse.json(
            { error: 'You do not have permission to publish posts' },
            { status: 403 }
          );
        }
        break;
        
      case PostStatus.READY_TO_PUBLISH:
        if (!canApprove) {
          return NextResponse.json(
            { error: 'You do not have permission to approve posts' },
            { status: 403 }
          );
        }
        break;
        
      case PostStatus.DECLINED:
        if (!canDecline) {
          return NextResponse.json(
            { error: 'You do not have permission to decline posts' },
            { status: 403 }
          );
        }
        
        // Ensure reason is provided for declined posts
        if (!reason) {
          return NextResponse.json(
            { error: 'A reason is required when declining a post' },
            { status: 400 }
          );
        }
        break;
        
      case PostStatus.UNPUBLISHED:
      case PostStatus.ARCHIVED:
        if (!canUnpublish) {
          return NextResponse.json(
            { error: 'You do not have permission to unpublish or archive posts' },
            { status: 403 }
          );
        }
        break;
    }
    
    // Update post status
    const updatedPost = await postService.changeStatus(
      id,
      status as PostStatus,
      session.user.id,
      reason
    );
    
    return NextResponse.json({ 
      post: updatedPost,
      message: 'Post status updated successfully' 
    });
    
  } catch (error: any) {
    console.error('Error updating post status:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating post status' },
      { status: 500 }
    );
  }
} 