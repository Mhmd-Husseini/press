import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/lib/services/role.service';
import { AuthService } from '@/lib/services/auth.service';

const roleService = new RoleService();
const authService = new AuthService();

// GET /api/admin/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission
    const hasPermission = await authService.hasPermission('view_roles');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized: Insufficient permissions' },
        { status: 403 }
      );
    }

    const roles = await roleService.getAll();
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission
    const hasPermission = await authService.hasPermission('create_roles');
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

    // Extract permissions from the request body
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    // Create the role
    const role = await roleService.create({
      name: body.name,
      nameArabic: body.nameArabic,
      description: body.description,
      descriptionArabic: body.descriptionArabic,
    }, permissions);

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    
    // Handle role already exists error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
} 