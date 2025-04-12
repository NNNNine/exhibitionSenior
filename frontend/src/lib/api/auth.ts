import api from './index';
import { User, UserRole } from '@/types/user.types';

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

/**
 * Register a new user
 * @param username User's username
 * @param email User's email
 * @param password User's password
 * @param role User's role
 */
export const register = async (
  username: string, 
  email: string, 
  password: string, 
  role: UserRole
): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', { username, email, password, role });
  return response.data;
};

/**
 * Login a user
 * @param email User's email
 * @param password User's password
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Refresh access token using HttpOnly refresh token cookie
 * This is safer as it doesn't require extracting the token from localStorage
 */
export const refreshToken = async (): Promise<{ token: string; refreshToken: string }> => {
  // No need to manually send the refresh token - it's sent automatically via HttpOnly cookie
  const response = await api.post('/auth/refresh-token');
  return response.data;
};

/**
 * Get current user information
 */
export const getCurrentUser = async (): Promise<User> => {
  console.log('API - Getting current user with token from cookies');
  try {
    const response = await api.get('/auth/me');
    console.log('API - Current user fetch successful');
    return response.data;
  } catch (error) {
    console.error('API - Current user fetch failed:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param currentPassword Current password
 * @param newPassword New password
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

/**
 * Request password reset
 * @param email User's email
 */
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset password with token
 * @param token Reset token
 * @param newPassword New password
 */
export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};