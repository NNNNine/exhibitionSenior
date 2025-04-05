import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/types/user.types';
import * as authApi from '@/lib/api';

interface UseAuthReturn {
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

const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
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
      
      // Redirect based on user role
      redirectUserBasedOnRole(user.role);
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
  const logout = useCallback(() => {
    // Clear tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Reset user state
    setUser(null);
    
    // Redirect to login page
    router.push('/auth/login');
  }, [router]);

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
        router.push('/artist');
        break;
      case UserRole.CURATOR:
        router.push('/curator');
        break;
      case UserRole.ADMIN:
        router.push('/admin');
        break;
      default:
        router.push('/');
        break;
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError,
    updateUser
  };
};

export default useAuth;