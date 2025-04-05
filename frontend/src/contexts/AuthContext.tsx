'use client'
import React, { createContext, useContext, ReactNode } from 'react';
import useAuth from '@/hooks/useAuth';
import { User, UserRole } from '@/types/user.types';

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

// Create context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
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

// Protect routes based on authentication status
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, isAuthenticated, loading } = useAuthContext();
  
  // State variables to handle redirection
  const [redirectPath, setRedirectPath] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      setRedirectPath(`/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
    } else if (!loading && requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
      setRedirectPath('/unauthorized');
    }
  }, [loading, isAuthenticated, requiredRoles, user]);

  if (redirectPath) {
    window.location.href = redirectPath;
    return null;
  }

  // If auth is still loading, show a spinner
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // If everything is okay, render the children
  return <>{children}</>;
};