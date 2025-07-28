import { NextResponse } from 'next/server';
import { auth } from './auth';

// Admin panel requires authentication
const isAdminRoute = (pathname: string) => {
  return pathname.startsWith('/admin') && pathname !== '/admin/login';
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for non-admin routes, API routes, and static files
  if (
    !pathname.startsWith('/admin') || 
    pathname.startsWith('/api') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow access to login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const isLoggedIn = !!req.auth?.user;
  
  // If not logged in and trying to access admin routes, redirect to login
  if (isAdminRoute(pathname) && !isLoggedIn) {
    const url = new URL('/admin/login', req.url);
    url.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

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