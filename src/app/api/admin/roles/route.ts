import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/lib/services/role.service';
import { AuthService } from '@/lib/services/auth.service';

const roleService = new RoleService();
const authService = new AuthService();

// GET /api/admin/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    // Debug: Log the current user
    const user = await authService.getCurrentUser();
    console.log('Current user from authService (roles):', user ? {
      id: user.id,
      email: user.email,
      roles: user.roles.map(r => r.role.name)
    } : null);
    
    // Debug: Check token directly
    const token = request.cookies.get('auth-token')?.value;
    console.log('Token found in cookies:', !!token);
    
    if (token) {
      try {
        const decoded = await authService.verifyToken(token);
        console.log('JWT token payload (roles):', decoded);
        
        // Check for admin role directly in token
        if (decoded) {
          const roles = decoded.roles || [];
          if (Array.isArray(roles) && (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN'))) {
            console.log('User has admin role in token, bypassing permission check');
            const roles = await roleService.getAll();
            return NextResponse.json(roles);
          }
        } else {
          console.log('Token verification failed - decoded payload is null');
        }
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    } else {
      console.log('No auth token found in cookies');
    }
    
    // Check if user has permission
    const hasPermission = await authService.hasPermission('view_roles');
    console.log('Has view_roles permission:', hasPermission);
    
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