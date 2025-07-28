import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Secret key for JWT
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'replace-this-with-a-secure-secret-key'
);

// Define protected routes and required permissions
const protectedRoutes = [
  {
    path: '/admin/users',
    permissions: ['view_users'],
  },
  {
    path: '/admin/users/create',
    permissions: ['create_users'],
  },
  {
    path: '/admin/users/edit',
    permissions: ['edit_users'],
  },
  {
    path: '/admin/users/delete',
    permissions: ['delete_users'],
  },
  {
    path: '/admin/roles',
    permissions: ['view_roles'],
  },
  {
    path: '/admin/roles/create',
    permissions: ['create_roles'],
  },
  {
    path: '/admin/roles/edit',
    permissions: ['edit_roles'],
  },
  {
    path: '/admin/roles/delete',
    permissions: ['delete_roles'],
  },
  {
    path: '/admin/permissions',
    permissions: ['view_permissions'],
  },
  {
    path: '/admin/settings',
    permissions: ['manage_settings'],
  },
  {
    path: '/admin/content',
    permissions: ['view_content'],
  },
];

// Admin panel requires at least a basic admin permission
const isAdminRoute = (pathname: string) => {
  return pathname.startsWith('/admin');
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for non-admin routes, API routes, and static files
  if (
    !isAdminRoute(pathname) || 
    pathname.startsWith('/api') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth-token')?.value;
  
  // If no token and trying to access admin routes, redirect to login
  if (!token) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://51.20.78.91';
    const url = new URL('/admin/login', baseUrl);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  try {
    // Verify the token
    const { payload } = await jwtVerify(token, SECRET_KEY);
    
    // Extract permissions from the verified token
    const userPermissions = payload.permissions as string[] || [];
    const userRoles = payload.roles as string[] || [];
    
    // Super admins can access everything
    if (userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')) {
      return NextResponse.next();
    }
    
    // For root admin path, just need to be logged in
    if (pathname === '/admin') {
      return NextResponse.next();
    }
    
    // Check if this is a protected route
    for (const route of protectedRoutes) {
      if (pathname.startsWith(route.path)) {
        // Check if user has any of the required permissions
        const hasPermission = route.permissions.some(permission => 
          userPermissions.includes(permission)
        );
        
        if (!hasPermission) {
          // If no permission, redirect to admin dashboard with error
          const url = new URL('/admin', request.url);
          url.searchParams.set('error', 'insufficient_permissions');
          return NextResponse.redirect(url);
        }
        
        // User has permission, allow access
        break;
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    const baseUrl = process.env.NEXTAUTH_URL || 'http://51.20.78.91';
    const url = new URL('/admin/login', baseUrl);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 