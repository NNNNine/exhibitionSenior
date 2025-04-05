// src/lib/api/exhibition.ts
import api from './index';
import { Exhibition, ExhibitionItem } from '@/types/exhibition.types';

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

/**
 * Get all exhibitions with filtering and pagination
 * @param params Filter and pagination parameters
 */
export const getExhibitions = async (params?: ExhibitionParams): Promise<ExhibitionsResponse> => {
  const response = await api.get('/exhibitions', { params });
  return response.data;
};

/**
 * Get exhibition by ID
 * @param id Exhibition ID
 */
export const getExhibitionById = async (id: string): Promise<Exhibition> => {
  const response = await api.get(`/exhibitions/${id}`);
  return response.data;
};

/**
 * Create new exhibition
 * @param exhibitionData Exhibition data
 */
export const createExhibition = async (exhibitionData: Partial<Exhibition>): Promise<Exhibition> => {
  const response = await api.post('/exhibitions', exhibitionData);
  return response.data;
};

/**
 * Update exhibition
 * @param id Exhibition ID
 * @param exhibitionData Updated exhibition data
 */
export const updateExhibition = async (id: string, exhibitionData: Partial<Exhibition>): Promise<Exhibition> => {
  const response = await api.put(`/exhibitions/${id}`, exhibitionData);
  return response.data;
};

/**
 * Delete exhibition
 * @param id Exhibition ID
 */
export const deleteExhibition = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/exhibitions/${id}`);
  return response.data;
};

/**
 * Add artwork to exhibition with position data
 * @param exhibitionId Exhibition ID
 * @param artworkId Artwork ID
 * @param position 3D position coordinates
 * @param rotation 3D rotation coordinates
 * @param scale 3D scale values
 */
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

/**
 * Update exhibition item position
 * @param exhibitionId Exhibition ID
 * @param itemId Exhibition item ID
 * @param data Position, rotation, and scale data
 */
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

/**
 * Remove artwork from exhibition
 * @param exhibitionId Exhibition ID
 * @param itemId Exhibition item ID
 */
export const removeArtworkFromExhibition = async (
  exhibitionId: string,
  itemId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/exhibitions/${exhibitionId}/items/${itemId}`);
  return response.data;
};

/**
 * Toggle exhibition active status
 * @param id Exhibition ID
 * @param isActive Active status
 */
export const toggleExhibitionStatus = async (
  id: string, 
  isActive: boolean
): Promise<Exhibition> => {
  const response = await api.patch(`/exhibitions/${id}/status`, { isActive });
  return response.data;
};

/**
 * Get visitor statistics for an exhibition
 * @param id Exhibition ID
 */
export const getExhibitionStats = async (
  id: string
): Promise<{ views: number, uniqueVisitors: number, avgTimeSpent: number }> => {
  const response = await api.get(`/exhibitions/${id}/stats`);
  return response.data;
};