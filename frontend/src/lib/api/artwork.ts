import api from './index';
import { Artwork } from '@/types/artwork.types';

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
  status?: string;
}

/**
 * Get all artworks with filtering and pagination
 * @param params Filter and pagination parameters
 */
export const getArtworks = async (params?: ArtworkParams): Promise<ArtworksResponse> => {
  const response = await api.get('/artworks', { params });
  return response.data;
};

/**
 * Get artwork by ID
 * @param id Artwork ID
 */
export const getArtworkById = async (id: string): Promise<Artwork> => {
  const response = await api.get(`/artworks/${id}`);
  return response.data;
};

/**
 * Create new artwork
 * @param formData Form data with artwork details and image
 */
export const createArtwork = async (formData: FormData): Promise<Artwork> => {
  const response = await api.post('/artworks', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Update artwork
 * @param id Artwork ID
 * @param formData Form data with updated artwork details
 */
export const updateArtwork = async (id: string, formData: FormData): Promise<Artwork> => {
  const response = await api.put(`/artworks/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Delete artwork
 * @param id Artwork ID
 */
export const deleteArtwork = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/artworks/${id}`);
  return response.data;
};

/**
 * Approve artwork (curator or admin only)
 * @param id Artwork ID
 */
export const approveArtwork = async (id: string): Promise<Artwork> => {
  const response = await api.patch(`/artworks/${id}/approve`);
  return response.data;
};

/**
 * Reject artwork (curator or admin only)
 * @param id Artwork ID
 * @param reason Optional reason for rejection
 */
export const rejectArtwork = async (id: string, reason?: string): Promise<Artwork> => {
  const response = await api.patch(`/artworks/${id}/reject`, { reason });
  return response.data;
};

/**
 * Like or unlike an artwork
 * @param id Artwork ID
 * @param like True to like, false to unlike
 */
export const toggleLikeArtwork = async (id: string, like: boolean): Promise<{ message: string }> => {
  const response = await api.post(`/artworks/${id}/${like ? 'like' : 'unlike'}`);
  return response.data;
};

/**
 * Add comment to artwork
 * @param id Artwork ID
 * @param content Comment content
 */
export const addComment = async (id: string, content: string): Promise<any> => {
  const response = await api.post(`/artworks/${id}/comments`, { content });
  return response.data;
};

/**
 * Delete comment from artwork
 * @param artworkId Artwork ID
 * @param commentId Comment ID
 */
export const deleteComment = async (artworkId: string, commentId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/artworks/${artworkId}/comments/${commentId}`);
  return response.data;
};