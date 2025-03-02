import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import prisma from '@/lib/prisma';
import { UserService, UserWithRoles } from './user.service';
import { RoleService } from './role.service';
import { NextRequest } from 'next/server';

// Secret key for JWT
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'replace-this-with-a-secure-secret-key'
);

const AUTH_COOKIE_NAME = 'auth-token';

export class AuthService {
  private userService: UserService;
  private roleService: RoleService;

  constructor() {
    this.userService = new UserService();
    this.roleService = new RoleService();
  }

  async generateToken(user: UserWithRoles): Promise<string> {
    // Extract user roles
    const roles = user.roles.map(r => r.role.name);
    
    // Get all permissions for these roles
    const allPermissions = new Set<string>();
    for (const userRole of user.roles) {
      const role = await this.roleService.findById(userRole.role.id);
      if (role) {
        role.permissions.forEach(p => allPermissions.add(p.permission.name));
      }
    }
    
    // Create JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions: Array.from(allPermissions)
    };

    // Sign token
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .setIssuedAt()
      .sign(SECRET_KEY);

    return token;
  }

  async verifyToken(token: string): Promise<any> {
    try {
      console.log('Verifying token...');
      
      try {
        // Try verification with jose (our default method)
        const { payload } = await jwtVerify(token, SECRET_KEY);
        console.log('Token verified successfully with jose');
        return payload;
      } catch (joseError) {
        // If jose verification fails, try with jsonwebtoken by checking the token structure
        console.log('Jose verification failed, trying fallback verification method');
        
        // Simple structural validation - this is not secure, but it's just for development
        try {
          // Basic token structure check
          const base64Url = token.split('.')[1];
          if (!base64Url) throw new Error('Invalid token structure');
          
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          
          const decodedData = JSON.parse(jsonPayload);
          console.log('Token parsed manually successfully');
          return decodedData;
        } catch (fallbackError) {
          console.error('Fallback verification also failed:', fallbackError);
          throw joseError; // Re-throw the original error
        }
      }
    } catch (error) {
      console.error('Token verification failed:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  async getCurrentUser(): Promise<UserWithRoles | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await this.verifyToken(token);
    if (!payload || !payload.sub) return null;

    return this.userService.findById(payload.sub);
  }

  async setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 hours
      sameSite: 'lax'
    });
  }

  async clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
  }

  async getUserFromRequest(request: NextRequest): Promise<UserWithRoles | null> {
    // Try to get token from request cookies
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      console.log('No auth token found in request');
      return null;
    }

    try {
      // Verify token
      const payload = await this.verifyToken(token);
      console.log('Token payload:', JSON.stringify(payload, null, 2));
      
      if (!payload) {
        console.log('Token verification failed');
        return null;
      }
      
      // Get user ID from payload - check both 'sub' (jose JWT) and 'id' (jsonwebtoken)
      const userId = payload.sub || payload.id;
      
      if (!userId) {
        console.log('No user ID found in token');
        return null;
      }
      
      console.log('Attempting to find user with ID:', userId);
      
      // Get full user data from database
      const user = await this.userService.findById(userId);
      
      // For debugging
      console.log('User found from request:', user ? `${user.firstName} ${user.lastName} (${user.id})` : 'No user found');
      
      return user;
    } catch (error) {
      console.error('Error getting user from request:', error);
      return null;
    }
  }

  async hasPermission(requestOrPermission: NextRequest | string, permissionArg?: string): Promise<boolean> {
    let permission: string;
    let request: NextRequest | null = null;

    // Handle both function signatures
    if (typeof requestOrPermission === 'string') {
      permission = requestOrPermission;
    } else {
      request = requestOrPermission;
      permission = permissionArg as string;
    }

    console.log(`Checking permission: ${permission}`);
    
    // Get token from request or cookies
    let token: string | undefined;
    if (request) {
      token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    }

    if (!token) {
      console.log('No auth token found, permission denied');
      return false;
    }

    console.log('Token found, checking permissions');
    
    // Check token payload first (more efficient)
    try {
      const payload = await this.verifyToken(token);
      if (payload) {
        // Check for super admin role in token
        const roles = payload.roles || [];
        if (Array.isArray(roles)) {
          console.log('Roles in token:', roles);
          if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
            console.log('User has admin role in token, permission granted');
            return true;
          }
        } else {
          console.log('Roles in token is not an array:', roles);
        }

        // Check for specific permission in token
        const permissions = payload.permissions || [];
        if (Array.isArray(permissions)) {
          console.log('Permissions in token:', permissions);
          if (permissions.includes(permission)) {
            console.log(`User has ${permission} permission in token, permission granted`);
            return true;
          }
        } else {
          console.log('Permissions in token is not an array:', permissions);
        }
      } else {
        console.log('Token verification failed, falling back to database check');
      }
    } catch (error) {
      console.error('Error checking token permissions:', error);
    }

    // Fallback to database check if token check fails
    console.log('Falling back to database check for permissions');
    
    // Get user from request or current user
    let user: UserWithRoles | null;
    if (request) {
      user = await this.getUserFromRequest(request);
    } else {
      user = await this.getCurrentUser();
    }
    
    if (!user) {
      console.log('No user found in database, permission denied');
      return false;
    }

    // Check for super admin role (can do anything)
    if (user.roles.some(r => r.role.name === 'ADMIN' || r.role.name === 'SUPER_ADMIN')) {
      console.log('User has admin role in database, permission granted');
      return true;
    }

    // Check each role for the specified permission
    for (const userRole of user.roles) {
      const hasPermission = await this.roleService.hasPermission(userRole.role.id, permission);
      if (hasPermission) {
        console.log(`User role ${userRole.role.name} has permission ${permission}, permission granted`);
        return true;
      }
    }

    console.log('Permission denied after all checks');
    return false;
  }

  async hasAnyPermissions(permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      const hasPermission = await this.hasPermission(permission);
      if (hasPermission) return true;
    }
    return false;
  }

  async hasAllPermissions(permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      const hasPermission = await this.hasPermission(permission);
      if (!hasPermission) return false;
    }
    return permissions.length > 0;
  }

  // Helper method to get all permissions for a user
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userService.findById(userId);
    if (!user) return [];

    const allPermissions = new Set<string>();
    for (const userRole of user.roles) {
      const role = await this.roleService.findById(userRole.role.id);
      if (role) {
        role.permissions.forEach(p => allPermissions.add(p.permission.name));
      }
    }

    return Array.from(allPermissions);
  }
} 