import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define paths that require authentication
const authenticatedPaths = [
  '/artist',
  '/curator',
  '/admin',
  '/profile/edit',
  '/artworks/upload',
  '/artworks/edit',
  '/exhibitions/create',
  '/exhibitions/edit',
];

// Define role-specific paths
const roleSpecificPaths: Record<string, string[]> = {
  artist: ['/artist', '/artworks/upload', '/artworks/edit'],
  curator: ['/curator', '/exhibitions/create', '/exhibitions/edit'],
  admin: ['/admin'],
};

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Check if path requires authentication
  const isAuthPath = authenticatedPaths.some(authPath => 
    path === authPath || path.startsWith(`${authPath}/`)
  );
  
  if (!isAuthPath) {
    return NextResponse.next();
  }
  
  // Check for authentication token
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    // Redirect to login with the current URL as the redirect target
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', encodeURIComponent(request.url));
    return NextResponse.redirect(redirectUrl);
  }
  
  // For role-specific paths, we may want to check user role
  // This would require decoding the JWT token or making an API call
  // For this simplified middleware, we'll just check for token existence
  
  return NextResponse.next();
}

// Configure paths that trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /static (static files)
     * 4. /favicon.ico, /robots.txt (common files)
     */
    '/((?!api|_next|static|favicon.ico|robots.txt).*)',
  ],
};