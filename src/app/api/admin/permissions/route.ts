import { NextRequest, NextResponse } from 'next/server';
import { PermissionService } from '@/lib/services/permission.service';
import { AuthService } from '@/lib/services/auth.service';

const permissionService = new PermissionService();
const authService = new AuthService();

// GET /api/admin/permissions - Get all permissions
export async function GET(request: NextRequest) {
  try {
    // Debug: Log the current user
    const user = await authService.getCurrentUser();
    console.log('Current user from authService:', user ? {
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
        console.log('JWT token payload:', decoded);
        
        // Check for admin role directly in token
        if (decoded) {
          const roles = decoded.roles || [];
          if (Array.isArray(roles) && (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN'))) {
            console.log('User has admin role in token, bypassing permission check');
            const permissions = await permissionService.getAll();
            return NextResponse.json(permissions);
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
    const hasPermission = await authService.hasPermission('view_permissions');
    console.log('Has view_permissions permission:', hasPermission);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized: Insufficient permissions' },
        { status: 403 }
      );
    }

    const permissions = await permissionService.getAll();
    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// POST /api/admin/permissions - Create a new permission
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission
    const hasPermission = await authService.hasPermission('create_permissions');
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

    // Create the permission
    const permission = await permissionService.create({
      name: body.name,
      nameArabic: body.nameArabic,
      description: body.description,
      descriptionArabic: body.descriptionArabic,
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    
    // Handle permission already exists error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    );
  }
} 