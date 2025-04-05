// src/lib/api/auth.ts
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
 * Refresh access token
 * @param refreshToken Current refresh token
 */
export const refreshToken = async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
  const response = await api.post('/auth/refresh-token', { refreshToken });
  return response.data;
};

/**
 * Get current user information
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
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