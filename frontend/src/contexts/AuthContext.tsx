'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, Spin, Button, Alert, Result } from 'antd';
import { User, UserRole } from '@/types/user.types';
import * as authApi from '@/lib/api/auth';

// Define the shape of our context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (updatedUser: User) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // const pathname = usePathname();

  // Check if user is already logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Debug token state
        console.log('Auth Check - localStorage token:', localStorage.getItem('token'));
        console.log('Auth Check - cookies:', document.cookie);
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('Auth Check - No token found in localStorage');
          setInitialLoading(false);
          setLoading(false);
          return;
        }

        console.log('Auth Check - Attempting to get current user with token');
        const userData = await authApi.getCurrentUser();
        console.log('Auth Check - User data retrieved:', userData ? 'success' : 'failed');
        setUser(userData);
      } catch (err) {
        console.error('Auth check error:', err);
        // Clear invalid tokens from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Clear tokens from cookies
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        
        console.log('Auth Check - Tokens cleared due to error');
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle login
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { user, token, refreshToken } = await authApi.login(email, password);
      
      // Store tokens in localStorage for client-side access
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set token in cookies for SSR/middleware authentication
      // Setting cookies without HttpOnly flag so they can be read from both client and server
      // Using SameSite=Lax which works better for cross-origin and redirect scenarios
      document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `refreshToken=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
      
      console.log('Login - Tokens set in localStorage and cookies');
      console.log('Login - localStorage token:', token ? `${token.substr(0, 10)}...` : 'none');
      console.log('Login - cookies after setting:', document.cookie);
      
      setUser(user);
      
      // Redirect based on user role or to the requested page
      const redirectTo = new URLSearchParams(window.location.search).get('redirectTo');
      if (redirectTo) {
        router.push(decodeURIComponent(redirectTo));
      } else {
        redirectUserBasedOnRole(user.role);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const register = async (username: string, email: string, password: string, role: UserRole) => {
    setLoading(true);
    setError(null);

    try {
      const { user, token, refreshToken } = await authApi.register(username, email, password, role);
      
      // Store tokens in localStorage for client-side access
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set token in cookies for SSR/middleware authentication
      // Setting cookies without HttpOnly flag so they can be read from both client and server
      // Using SameSite=Lax which works better for cross-origin and redirect scenarios
      document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `refreshToken=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
      
      console.log('Login - Tokens set in localStorage and cookies');
      console.log('Login - localStorage token:', token ? `${token.substr(0, 10)}...` : 'none');
      console.log('Login - cookies after setting:', document.cookie);
      
      setUser(user);
      
      // Redirect to appropriate dashboard
      redirectUserBasedOnRole(user.role);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const logout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Clear tokens from cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    
    console.log('Logout - Tokens cleared from localStorage and cookies');
    
    // Reset user state
    setUser(null);
    
    // Redirect to login page
    router.push('/auth/login');
  };

  // Utility to update user in state
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Clear error
  const clearError = () => setError(null);

  // Helper function to redirect based on role
  const redirectUserBasedOnRole = (role: UserRole) => {
    switch (role) {
      case UserRole.ARTIST:
        router.push('/dashboard/artist');
        break;
      case UserRole.CURATOR:
        router.push('/dashboard/curator');
        break;
      case UserRole.ADMIN:
        router.push('/dashboard/admin');
        break;
      default:
        router.push('/');
        break;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading: loading || initialLoading,
      error,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      clearError,
      updateUser
    }}>
      {!initialLoading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
  showUnauthorized?: boolean; // Whether to show a 403 page or redirect
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [],
  redirectTo,
  showUnauthorized = true // Default to showing 403 page
}) => {
  const { user, isAuthenticated, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  
  // Enhanced auth check with role validation
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // If not authenticated, redirect to login with return URL
        const returnUrl = encodeURIComponent(pathname || '/');
        router.replace(`/auth/login?redirectTo=${returnUrl}`);
        setHasAccess(false);
      } else if (requiredRoles.length > 0 && user) {
        // Check if user has required role
        const hasRequiredRole = requiredRoles.includes(user.role);
        setHasAccess(hasRequiredRole);
        
        // If no access and we should redirect (not show 403)
        if (!hasRequiredRole && !showUnauthorized) {
          // Redirect to provided URL or dashboard based on role
          const targetUrl = redirectTo || getDashboardByRole(user.role);
          router.replace(targetUrl);
        }
      } else {
        // Authenticated and no specific role required
        setHasAccess(true);
      }
    }
  }, [loading, isAuthenticated, user, requiredRoles, pathname, router, redirectTo, showUnauthorized]);

  // Helper function to get dashboard URL by role
  const getDashboardByRole = (role: UserRole): string => {
    switch (role) {
      case UserRole.ARTIST:
        return '/dashboard/artist';
      case UserRole.CURATOR:
        return '/dashboard/curator';
      case UserRole.ADMIN:
        return '/dashboard/admin';
      default:
        return '/';
    }
  };

  // If loading, show spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96 text-center p-6">
          <Spin size="large" />
          <p className="mt-4">Verifying access...</p>
        </Card>
      </div>
    );
  }
  
  // If access check completed and no access, show 403 error
  if (hasAccess === false && showUnauthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Result
          status="403"
          title="Unauthorized Access"
          subTitle={
            isAuthenticated
              ? `Your current role (${user?.role}) does not have permission to access this page`
              : "Please log in to access this page"
          }
          extra={[
            <Button 
              type="primary" 
              key="home" 
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>,
            isAuthenticated && (
              <Button 
                key="dashboard" 
                onClick={() => router.push(getDashboardByRole(user!.role))}
              >
                Go to My Dashboard
              </Button>
            ),
            !isAuthenticated && (
              <Button 
                key="login" 
                onClick={() => router.push(`/auth/login?redirectTo=${encodeURIComponent(pathname || '/')}`)}
              >
                Login
              </Button>
            )
          ]}
        />
      </div>
    );
  }
  
  // If access granted, render children
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Default loading state (while redirecting)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin size="large" />
    </div>
  );
};

// Create a HOC wrapper for protected pages
export const withProtectedRoute = (
  Component: React.ComponentType<any>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};