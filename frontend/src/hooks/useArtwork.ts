import { useState, useEffect, useCallback } from 'react';
import { Artwork } from '@/types/artwork.types';
import * as api from '@/lib/api';

interface UseArtworksParams {
  category?: string;
  artist?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseArtworksReturn {
  artworks: Artwork[];
  loading: boolean;
  error: string | null;
  totalArtworks: number;
  currentPage: number;
  totalPages: number;
  fetchArtworks: (page?: number) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  uploadArtwork: (formData: FormData) => Promise<Artwork>;
  updateArtwork: (id: string, formData: FormData) => Promise<Artwork>;
  deleteArtwork: (id: string) => Promise<void>;
  setFilters: (filters: Partial<UseArtworksParams>) => void;
}

const useArtworks = (params: UseArtworksParams = {}): UseArtworksReturn => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalArtworks, setTotalArtworks] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(params.page || 1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [filters, setFiltersState] = useState<UseArtworksParams>({
    category: params.category,
    artist: params.artist,
    tags: params.tags,
    search: params.search,
    limit: params.limit || 12,
    autoFetch: params.autoFetch !== false, // Default to true
  });

  // Update filters
  const setFilters = useCallback((newFilters: Partial<UseArtworksParams>) => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      ...newFilters,
    }));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, []);

  // Fetch artworks
  const fetchArtworks = useCallback(async (page: number = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const { artworks: fetchedArtworks, pagination } = await api.getArtworks({
        ...filters,
        page,
      });

      setArtworks(fetchedArtworks);
      setTotalArtworks(pagination.total);
      setCurrentPage(pagination.page);
      setTotalPages(pagination.pages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  // Fetch next page
  const fetchNextPage = useCallback(async () => {
    if (currentPage < totalPages) {
      await fetchArtworks(currentPage + 1);
    }
  }, [currentPage, totalPages, fetchArtworks]);

  // Fetch previous page
  const fetchPreviousPage = useCallback(async () => {
    if (currentPage > 1) {
      await fetchArtworks(currentPage - 1);
    }
  }, [currentPage, fetchArtworks]);

  // Upload artwork
  const uploadArtwork = useCallback(async (formData: FormData): Promise<Artwork> => {
    try {
      const newArtwork = await api.createArtwork(formData);
      // Refresh artworks after upload if needed
      if (filters.autoFetch) {
        await fetchArtworks();
      }
      return newArtwork;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [filters.autoFetch, fetchArtworks]);

  // Update artwork
  const updateArtwork = useCallback(async (id: string, formData: FormData): Promise<Artwork> => {
    try {
      const updatedArtwork = await api.updateArtwork(id, formData);
      // Update artwork in state
      setArtworks(prevArtworks => 
        prevArtworks.map(artwork => 
          artwork.id === id ? updatedArtwork : artwork
        )
      );
      return updatedArtwork;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete artwork
  const deleteArtwork = useCallback(async (id: string): Promise<void> => {
    try {
      await api.deleteArtwork(id);
      // Remove artwork from state
      setArtworks(prevArtworks => 
        prevArtworks.filter(artwork => artwork.id !== id)
      );
      // Refresh artworks if needed
      if (filters.autoFetch) {
        await fetchArtworks();
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [filters.autoFetch, fetchArtworks]);

  // Fetch artworks on mount and when dependencies change
  useEffect(() => {
    if (filters.autoFetch) {
      fetchArtworks();
    }
  }, [filters.category, filters.artist, filters.tags, filters.search, filters.limit, fetchArtworks, filters.autoFetch]);

  return {
    artworks,
    loading,
    error,
    totalArtworks,
    currentPage,
    totalPages,
    fetchArtworks,
    fetchNextPage,
    fetchPreviousPage,
    uploadArtwork,
    updateArtwork,
    deleteArtwork,
    setFilters,
  };
};

export default useArtworks;