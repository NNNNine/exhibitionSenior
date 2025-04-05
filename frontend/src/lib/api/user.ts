// src/lib/api/user.ts
import api from './index';
import { User, UserRole } from '@/types/user.types';
import { Artwork } from '@/types/artwork.types';

interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface UserParams {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

/**
 * Get all users with pagination and filtering
 * @param params Filter and pagination parameters
 */
export const getUsers = async (params?: UserParams): Promise<UsersResponse> => {
  const response = await api.get('/users', { params });
  return response.data;
};

/**
 * Get user by ID
 * @param id User ID
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

/**
 * Get user by username
 * @param username Username
 */
export const getUserByUsername = async (username: string): Promise<User> => {
  const response = await api.get(`/users/username/${username}`);
  return response.data;
};

/**
 * Update user information
 * @param id User ID
 * @param userData Updated user data
 */
export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

/**
 * Delete user
 * @param id User ID
 */
export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

/**
 * Get artworks by user
 * @param userId User ID
 * @param page Page number
 * @param limit Items per page
 */
export const getUserArtworks = async (
  userId: string, 
  page = 1, 
  limit = 10
): Promise<{ artworks: Artwork[], pagination: any }> => {
  const response = await api.get(`/users/artworks/${userId}`, { 
    params: { page, limit } 
  });
  return response.data;
};