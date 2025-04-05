'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  // Check if user is already logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setInitialLoading(false);
          setLoading(false);
          return;
        }

        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Auth check error:', err);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
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
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
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
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
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
    // Clear tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
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
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, isAuthenticated, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  
  // Handle authentication and authorization
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // If not authenticated, redirect to login
        router.replace(`/auth/login?redirectTo=${encodeURIComponent(pathname || '/')}`);
      } else if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
        // If authenticated but doesn't have required role, redirect to unauthorized
        router.replace('/unauthorized');
      }
    }
  }, [loading, isAuthenticated, user, requiredRoles, router, pathname]);

  // If auth is still loading, show a spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If not authenticated or doesn't have required role, show nothing
  if (!isAuthenticated || (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role))) {
    return null;
  }
  
  // If everything is okay, render the children
  return <>{children}</>;
};