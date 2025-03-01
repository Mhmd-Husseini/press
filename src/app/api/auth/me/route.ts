import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/auth';

// GET /api/auth/me - Get current user information
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Map roles and permissions from the database structure
    const roles = user.roles.map(r => r.role.name);
    const permissions = [];
    
    // Extract permissions from roles
    for (const userRole of user.roles) {
      if (userRole.role.permissions) {
        const rolePermissions = userRole.role.permissions.map(p => p.permission.name);
        permissions.push(...rolePermissions);
      }
    }

    // Remove duplicates from permissions
    const uniquePermissions = [...new Set(permissions)];
    
    // Return user data without sensitive information
    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions: uniquePermissions,
    });
  } catch (error) {
    console.error('Error retrieving current user:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user information' },
      { status: 500 }
    );
  }
} 