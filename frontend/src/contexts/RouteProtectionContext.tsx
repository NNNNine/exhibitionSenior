'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from './AuthContext';
import { getRouteConfig, canAccessRoute } from '@/config/routes';

interface RouteProtectionContextType {
  isProtectedRoute: boolean;
  hasAccess: boolean;
  checkAccess: (path: string) => boolean;
}

const RouteProtectionContext = createContext<RouteProtectionContextType | undefined>(undefined);

interface RouteProtectionProviderProps {
  children: React.ReactNode;
}

export const RouteProtectionProvider: React.FC<RouteProtectionProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const { user, isAuthenticated, loading } = useAuthContext();
  const router = useRouter();
  
  const [isProtectedRoute, setIsProtectedRoute] = useState<boolean>(false);
  const [hasAccess, setHasAccess] = useState<boolean>(true);

  // Check if current route is protected and if user has access
  useEffect(() => {
    if (loading) return; // Skip during auth loading

    const routeConfig = getRouteConfig(pathname || '/');
    
    // Set whether current route is protected
    setIsProtectedRoute(!!routeConfig);
    
    // If route is protected, check access
    if (routeConfig) {
      const userHasAccess = isAuthenticated && user && routeConfig.roles.includes(user.role);
      if (!userHasAccess) {
        setHasAccess(false);
      }
      else setHasAccess(userHasAccess);
      
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        const returnUrl = encodeURIComponent(pathname || '/');
        router.replace(`/auth/login?redirectTo=${returnUrl}`);
      } 
      // If authenticated but no access, redirect to unauthorized page
      else if (!userHasAccess) {
        router.replace(routeConfig.redirectTo || '/unauthorized');
      }
    }
  }, [pathname, isAuthenticated, user, loading, router]);

  // Function to check access for a specific path
  const checkAccess = (path: string): boolean => {
    if (!isAuthenticated || !user) return false;
    return canAccessRoute(path, user.role);
  };

  return (
    <RouteProtectionContext.Provider
      value={{
        isProtectedRoute,
        hasAccess,
        checkAccess
      }}
    >
      {children}
    </RouteProtectionContext.Provider>
  );
};

// Hook for using the route protection context
export const useRouteProtection = (): RouteProtectionContextType => {
  const context = useContext(RouteProtectionContext);
  if (!context) {
    throw new Error('useRouteProtection must be used within a RouteProtectionProvider');
  }
  return context;
};

export default RouteProtectionProvider;