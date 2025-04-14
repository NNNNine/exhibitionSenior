import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRouteConfig } from './config/routes';
import { UserRole } from './types/user.types';
import { jwtVerify } from 'jose';

interface DecodedToken {
  id: string;
  role: UserRole;
}

// Function to parse and verify JWT token
async function parseToken(token: string): Promise<DecodedToken | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    
    // jose uses a different API than jsonwebtoken
    const { payload } = await jwtVerify(token, secret);
    
    return {
      id: payload.id as string,
      role: payload.role as UserRole
    };
  } catch (error) {
    console.error('Failed to verify JWT token:', error);
    return null;
  }
}

// Check if this is a login or registration page
const isAuthPage = (path: string): boolean => {
  return path.startsWith('/auth/') || path === '/auth';
};

export async function middleware(request: NextRequest) {
  // Get the current path
  const path = request.nextUrl.pathname;

  const isBrotliAsset = path.match(/\.(js|wasm|data|framework)\.br$/);
  if (isBrotliAsset) {
    const res = NextResponse.next();
    res.headers.set('Content-Encoding', 'br');

    if (path.endsWith('.js.br')) {
      res.headers.set('Content-Type', 'application/javascript');
    } else if (path.endsWith('.wasm.br')) {
      res.headers.set('Content-Type', 'application/wasm');
    } else if (path.endsWith('.data.br')) {
      res.headers.set('Content-Type', 'application/octet-stream');
    } else if (path.endsWith('.framework.br')) {
      res.headers.set('Content-Type', 'application/javascript');
    }

    return res;
  }
  
  // Skip middleware for auth pages
  if (isAuthPage(path)) {
    return NextResponse.next();
  }
  
  // Check if this is a protected route
  const routeConfig = getRouteConfig(path);
  
  // If not a protected route, continue
  if (!routeConfig) {
    return NextResponse.next();
  }
  
  // Get token from cookies (using HttpOnly cookies instead of localStorage)
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  // If no token found, redirect to login with the return URL
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', encodeURIComponent(request.url));
    
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Parse and verify token (await the async function)
    const userData = await parseToken(token);
    
    // If token is invalid or user data is missing, redirect to login
    if (!userData || !userData.role) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', encodeURIComponent(request.url));
      loginUrl.searchParams.set('expired', 'true');
      
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
  } catch (error) {
    // Handle any errors during token verification
    console.error('Authentication error:', error);
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', encodeURIComponent(request.url));
    loginUrl.searchParams.set('error', 'true');
    
    return NextResponse.redirect(loginUrl);
  }
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
    '/unity/Build/:path*',
  ],
};