import { NextRequest, NextResponse } from 'next/server';
import { postLockService } from '@/lib/services/postLock.service';
import { AuthService } from '@/lib/services/auth.service';

const authService = new AuthService();

/**
 * GET /api/admin/posts/lock/[postId] - Check lock status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Get user from request
    const user = await authService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const lockStatus = postLockService.getLockStatus(postId);

    return NextResponse.json(lockStatus);
  } catch (error) {
    console.error('Error checking lock status:', error);
    return NextResponse.json({ error: 'Failed to check lock status' }, { status: 500 });
  }
}

/**
 * POST /api/admin/posts/lock/[postId] - Acquire lock
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Get user from request
    const user = await authService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.email;

    const result = postLockService.acquireLock(
      postId,
      user.id,
      user.email,
      userName
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Post is currently being edited by another user',
          existingLock: result.existingLock 
        }, 
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json({ success: true, lock: result.lock });
  } catch (error) {
    console.error('Error acquiring lock:', error);
    return NextResponse.json({ error: 'Failed to acquire lock' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/posts/lock/[postId] - Update heartbeat
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Get user from request
    const user = await authService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const result = postLockService.updateHeartbeat(postId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Lock not found or not owned by user' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/posts/lock/[postId] - Release lock
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Get user from request
    const user = await authService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    
    // Check if this is a force release (admin only)
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (force) {
      // Check if user has admin permissions
      const canForceRelease = await authService.hasPermission(request, 'manage_content');
      if (!canForceRelease) {
        return NextResponse.json({ error: 'Unauthorized to force release locks' }, { status: 403 });
      }

      const result = postLockService.forceReleaseLock(postId);
      return NextResponse.json({ success: result.success });
    }

    // Normal release
    const result = postLockService.releaseLock(postId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Lock not found or not owned by user' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error releasing lock:', error);
    return NextResponse.json({ error: 'Failed to release lock' }, { status: 500 });
  }
}

