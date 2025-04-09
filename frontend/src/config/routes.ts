import { UserRole } from '@/types/user.types';

export interface RouteConfig {
  path: string;
  roles: UserRole[];
  redirectTo?: string;
}

/**
 * Route configuration mapping for protected routes
 * Key: Route path or pattern
 * Value: Configuration object with allowed roles and redirect options
 */
export const protectedRoutes: Record<string, RouteConfig> = {
  // Dashboard routes
  '/dashboard/artist': {
    path: '/dashboard/artist',
    roles: [UserRole.ARTIST, UserRole.ADMIN],
    redirectTo: '/'
  },
  '/dashboard/curator': {
    path: '/dashboard/curator',
    roles: [UserRole.CURATOR, UserRole.ADMIN],
    redirectTo: '/'
  },
  '/dashboard/admin': {
    path: '/dashboard/admin',
    roles: [UserRole.ADMIN],
    redirectTo: '/'
  },
  
  // Artist-specific routes
  '/artworks/upload': {
    path: '/artworks/upload',
    roles: [UserRole.ARTIST, UserRole.ADMIN],
    redirectTo: '/artworks'
  },
  '/artworks/edit': {
    path: '/artworks/edit',
    roles: [UserRole.ARTIST, UserRole.ADMIN],
    redirectTo: '/artworks'
  },
  
  // Curator-specific routes
  '/exhibitions/create': {
    path: '/exhibitions/create',
    roles: [UserRole.CURATOR, UserRole.ADMIN],
    redirectTo: '/exhibitions'
  },
  '/exhibitions/edit': {
    path: '/exhibitions/edit',
    roles: [UserRole.CURATOR, UserRole.ADMIN],
    redirectTo: '/exhibitions'
  },
  
  // Profile routes
  '/profile/edit': {
    path: '/profile/edit',
    roles: [UserRole.VISITOR, UserRole.ARTIST, UserRole.CURATOR, UserRole.ADMIN],
    redirectTo: '/auth/login'
  }
};

/**
 * Check if a given path is protected
 * @param path The path to check
 * @returns The route config if protected, undefined otherwise
 */
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  // First check for exact match
  if (protectedRoutes[path]) {
    return protectedRoutes[path];
  }
  
  // Then check for pattern matches (e.g., /artworks/edit/123)
  for (const routePath in protectedRoutes) {
    // Check if path starts with a protected route pattern (capturing subpaths)
    if (path.startsWith(routePath + '/')) {
      return protectedRoutes[routePath];
    }
  }
  
  return undefined;
};

/**
 * Check if the current user can access a specific route
 * @param path Route path
 * @param userRole User's role
 * @returns {boolean} Whether the user has access
 */
export const canAccessRoute = (path: string, userRole?: UserRole): boolean => {
  if (!userRole) return false;
  
  const routeConfig = getRouteConfig(path);
  
  // If route is not protected, allow access
  if (!routeConfig) return true;
  
  // Check if user's role is allowed
  return routeConfig.roles.includes(userRole);
};