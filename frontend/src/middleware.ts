import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getRouteConfig } from './config/routes';
import { UserRole } from './types/user.types';

// Function to parse JWT token
const parseToken = (token: string): { id: string; role: UserRole } | null => {
  try {
    // In a real app, you'd verify with the same secret used on the backend
    // This is a simple decode for middleware (real verification happens on API calls)
    const decoded = jwt.decode(token) as { id: string; role: UserRole };
    return decoded;
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
};

export async function middleware(request: NextRequest) {
  // Get the current path
  const path = request.nextUrl.pathname;
  
  // Check if this is a protected route
  const routeConfig = getRouteConfig(path);
  
  // If not a protected route, continue
  if (!routeConfig) {
    return NextResponse.next();
  }
  
  // Get token from cookies or headers
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  // If no token found, redirect to login with the return URL
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', encodeURIComponent(request.url));
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Parse and verify token
  const userData = parseToken(token);
  
  // If token is invalid or user data is missing, redirect to login
  if (!userData || !userData.role) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', encodeURIComponent(request.url));
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Check if user role has access to the requested route
  if (!routeConfig.roles.includes(userData.role)) {
    // Redirect to 403 page or specified redirect URL
    const redirectUrl = new URL(routeConfig.redirectTo || '/unauthorized', request.url);
    
    return NextResponse.redirect(redirectUrl);
  }
  
  // User is authenticated and authorized, proceed
  return NextResponse.next();
}

// Configure paths that trigger this middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/edit/:path*',
    '/artworks/upload/:path*',
    '/artworks/edit/:path*',
    '/exhibitions/create/:path*',
    '/exhibitions/edit/:path*',
  ],
};