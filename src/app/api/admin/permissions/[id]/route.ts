import { NextRequest, NextResponse } from 'next/server';
import { PermissionService } from '@/lib/services/permission.service';
import { AuthService } from '@/lib/services/auth.service';

const permissionService = new PermissionService();
const authService = new AuthService();

// GET /api/admin/permissions/[id] - Get a permission by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission
    const hasPermission = await authService.hasPermission('view_permissions');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized: Insufficient permissions' },
        { status: 403 }
      );
    }

    const permission = await permissionService.findById(params.id);
    
    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(permission);
  } catch (error) {
    console.error('Error fetching permission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/permissions/[id] - Update a permission
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission
    const hasPermission = await authService.hasPermission('edit_permissions');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized: Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    if (!body.name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // Check if permission exists
    const existingPermission = await permissionService.findById(params.id);
    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Update the permission
    const updatedPermission = await permissionService.update(params.id, {
      name: body.name,
      nameArabic: body.nameArabic,
      description: body.description,
      descriptionArabic: body.descriptionArabic,
    });

    return NextResponse.json(updatedPermission);
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/permissions/[id] - Delete a permission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission
    const hasPermission = await authService.hasPermission('delete_permissions');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if permission exists
    const existingPermission = await permissionService.findById(params.id);
    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Delete the permission
    await permissionService.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
} 