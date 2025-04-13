// src/lib/api/exhibition.ts
import api from './index';
import { 
  Exhibition, 
  Wall, 
  ExhibitionCreateData, 
  WallData, 
  WallLayoutData 
} from '@/types/exhibition.types';
import { Artwork } from '@/types/artwork.types';

/**
 * Get the active exhibition with all walls and artwork placements
 */
export const getExhibition = async (): Promise<{exhibition: Exhibition}> => {
  const response = await api.get('/exhibition');
  return response.data;
};

/**
 * Create or update the exhibition
 * @param data Exhibition data
 */
export const createOrUpdateExhibition = async (data: ExhibitionCreateData): Promise<Exhibition> => {
  const response = await api.post('/exhibition', data);
  return response.data;
};

/**
 * Get all walls for the exhibition
 */
export const getWalls = async (): Promise<Wall[]> => {
  const response = await api.get('/exhibition/walls');
  return response.data;
};

/**
 * Create a new wall
 * @param data Wall data
 */
export const createWall = async (data: WallData): Promise<Wall> => {
  const response = await api.post('/exhibition/walls', data);
  return response.data;
};

/**
 * Update a wall
 * @param id Wall ID
 * @param data Updated wall data
 */
export const updateWall = async (id: string, data: WallData): Promise<Wall> => {
  const response = await api.put(`/exhibition/walls/${id}`, data);
  return response.data;
};

/**
 * Delete a wall
 * @param id Wall ID
 */
export const deleteWall = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/exhibition/walls/${id}`);
  return response.data;
};

/**
 * Update the layout of artworks on a wall
 * @param wallId Wall ID
 * @param data Layout data with artwork placements
 */
export const updateWallLayout = async (wallId: string, data: WallLayoutData): Promise<Wall> => {
  const response = await api.post(`/exhibition/walls/${wallId}/layout`, data);
  return response.data;
};

/**
 * Get all approved artworks for placement (curator's stockpile)
 */
export const getArtworksForPlacement = async (): Promise<Artwork[]> => {
  const response = await api.get('/exhibition/stockpile');
  console.log('Artworks for placement:', response);
  return response.data;
};

/**
 * Save the complete exhibition layout to be used by Unity WebGL
 * @param exhibitionId Exhibition ID (optional in single exhibition system)
 */
export const saveExhibitionLayout = async (exhibitionId?: string): Promise<{ message: string }> => {
  // In a single exhibition system, the exhibitionId might be optional
  const endpoint = exhibitionId 
    ? `/exhibition/${exhibitionId}/save-layout` 
    : '/exhibition/save-layout';
  
  const response = await api.post(endpoint);
  return response.data;
};

/**
 * Get the Unity compatible layout data for rendering the exhibition
 * This endpoint would be called by the Unity WebGL application
 * @param exhibitionId Exhibition ID (optional in single exhibition system)
 */
export const getUnityLayout = async (exhibitionId?: string): Promise<any> => {
  // In a single exhibition system, the exhibitionId might be optional
  const endpoint = exhibitionId 
    ? `/exhibition/${exhibitionId}/unity-layout` 
    : '/exhibition/unity-layout';
  
  const response = await api.get(endpoint);
  return response.data;
};