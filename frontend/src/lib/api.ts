import axios from 'axios';
import { User, UserRole } from '@/types/user.types';
import { Artwork } from '@/types/artwork.types';
import { Exhibition, ExhibitionItem } from '@/types/exhibition.types';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      // Clear tokens from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Clear tokens from cookies
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      
      window.location.href = '/auth/login?expired=true';
    }
    
    // Format the error message
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error?.message ||
      error.message || 
      'An unexpected error occurred';
    
    return Promise.reject(new Error(errorMessage));
  }
);

// =========== Authentication APIs ===========

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const register = async (
  username: string, 
  email: string, 
  password: string, 
  role: UserRole
): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', { username, email, password, role });
  return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const refreshToken = async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
  const response = await api.post('/auth/refresh-token', { refreshToken });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

// =========== User APIs ===========

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

export const getUsers = async (params?: UserParams): Promise<UsersResponse> => {
  const response = await api.get('/users', { params });
  return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const getUserByUsername = async (username: string): Promise<User> => {
  const response = await api.get(`/users/username/${username}`);
  return response.data;
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const getUserArtworks = async (userId: string, page = 1, limit = 10): Promise<{ artworks: Artwork[], pagination: any }> => {
  const response = await api.get(`/users/artworks/${userId}`, { params: { page, limit } });
  return response.data;
};

// =========== Artwork APIs ===========

interface ArtworksResponse {
  artworks: Artwork[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface ArtworkParams {
  category?: string;
  artist?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export const getArtworks = async (params?: ArtworkParams): Promise<ArtworksResponse> => {
  const response = await api.get('/artworks', { params });
  return response.data;
};

export const getArtworkById = async (id: string): Promise<Artwork> => {
  const response = await api.get(`/artworks/${id}`);
  return response.data;
};

export const createArtwork = async (formData: FormData): Promise<Artwork> => {
  const response = await api.post('/artworks', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateArtwork = async (id: string, formData: FormData): Promise<Artwork> => {
  const response = await api.put(`/artworks/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteArtwork = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/artworks/${id}`);
  return response.data;
};

// =========== Exhibition APIs ===========

interface ExhibitionsResponse {
  exhibitions: Exhibition[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface ExhibitionParams {
  curator?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const getExhibitions = async (params?: ExhibitionParams): Promise<ExhibitionsResponse> => {
  const response = await api.get('/exhibitions', { params });
  return response.data;
};

export const getExhibitionById = async (id: string): Promise<Exhibition> => {
  const response = await api.get(`/exhibitions/${id}`);
  return response.data;
};

export const createExhibition = async (exhibitionData: Partial<Exhibition>): Promise<Exhibition> => {
  const response = await api.post('/exhibitions', exhibitionData);
  return response.data;
};

export const updateExhibition = async (id: string, exhibitionData: Partial<Exhibition>): Promise<Exhibition> => {
  const response = await api.put(`/exhibitions/${id}`, exhibitionData);
  return response.data;
};

export const deleteExhibition = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/exhibitions/${id}`);
  return response.data;
};

// Exhibition Items (3D positioning of artworks)
export const addArtworkToExhibition = async (
  exhibitionId: string, 
  artworkId: string, 
  position: { x: number, y: number, z: number },
  rotation: { x: number, y: number, z: number },
  scale: { x: number, y: number, z: number }
): Promise<ExhibitionItem> => {
  const response = await api.post(`/exhibitions/${exhibitionId}/items`, {
    artworkId,
    position,
    rotation,
    scale
  });
  return response.data;
};

export const updateExhibitionItem = async (
  exhibitionId: string,
  itemId: string,
  data: {
    position?: { x: number, y: number, z: number },
    rotation?: { x: number, y: number, z: number },
    scale?: { x: number, y: number, z: number }
  }
): Promise<ExhibitionItem> => {
  const response = await api.put(`/exhibitions/${exhibitionId}/items/${itemId}`, data);
  return response.data;
};

export const removeArtworkFromExhibition = async (
  exhibitionId: string,
  itemId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/exhibitions/${exhibitionId}/items/${itemId}`);
  return response.data;
};

export default api;