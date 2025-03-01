import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import prisma from '@/lib/prisma';
import { UserService, UserWithRoles } from './user.service';
import { RoleService } from './role.service';

// Secret key for JWT
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'replace-this-with-a-secure-secret-key'
);

const AUTH_COOKIE_NAME = 'auth_token';

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
      const { payload } = await jwtVerify(token, SECRET_KEY);
      return payload;
    } catch (error) {
      return null;
    }
  }

  async getCurrentUser(): Promise<UserWithRoles | null> {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await this.verifyToken(token);
    if (!payload || !payload.sub) return null;

    return this.userService.findById(payload.sub);
  }

  async setAuthCookie(token: string): Promise<void> {
    cookies().set({
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
    cookies().delete(AUTH_COOKIE_NAME);
  }

  async hasPermission(permission: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Check for super admin role (can do anything)
    if (user.roles.some(r => r.role.name === 'ADMIN' || r.role.name === 'SUPER_ADMIN')) {
      return true;
    }

    // Check each role for the specified permission
    for (const userRole of user.roles) {
      const hasPermission = await this.roleService.hasPermission(userRole.role.id, permission);
      if (hasPermission) return true;
    }

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