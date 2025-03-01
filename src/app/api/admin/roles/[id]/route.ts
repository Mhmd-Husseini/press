import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/lib/services/role.service';
import { AuthService } from '@/lib/services/auth.service';

const roleService = new RoleService();
const authService = new AuthService();

// GET /api/admin/roles/[id] - Get a role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission
    const hasPermission = await authService.hasPermission('view_roles');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized: Insufficient permissions' },
        { status: 403 }
      );
    }

    const role = await roleService.findById(params.id);
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles/[id] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission
    const hasPermission = await authService.hasPermission('edit_roles');
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
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await roleService.findById(params.id);
    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Extract permissions from the request body
    const permissions = Array.isArray(body.permissions) ? body.permissions : undefined;

    // Update the role
    const updatedRole = await roleService.update(
      params.id,
      {
        name: body.name,
        nameArabic: body.nameArabic,
        description: body.description,
        descriptionArabic: body.descriptionArabic,
      },
      permissions
    );

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles/[id] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission
    const hasPermission = await authService.hasPermission('delete_roles');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if role exists
    const existingRole = await roleService.findById(params.id);
    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Special case: prevent deleting built-in roles
    const protectedRoles = ['ADMIN', 'SUPER_ADMIN', 'USER'];
    if (protectedRoles.includes(existingRole.name)) {
      return NextResponse.json(
        { error: 'Cannot delete built-in roles' },
        { status: 403 }
      );
    }

    // Delete the role
    await roleService.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
} 