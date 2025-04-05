import { useState, useEffect, useCallback } from 'react';
import { Exhibition, ExhibitionCreateData, ExhibitionUpdateData } from '@/types/exhibition.types';
import * as api from '@/lib/api';

interface UseExhibitionsParams {
  curator?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseExhibitionsReturn {
  exhibitions: Exhibition[];
  loading: boolean;
  error: string | null;
  totalExhibitions: number;
  currentPage: number;
  totalPages: number;
  fetchExhibitions: (page?: number) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  createExhibition: (data: ExhibitionCreateData) => Promise<Exhibition>;
  updateExhibition: (id: string, data: ExhibitionUpdateData) => Promise<Exhibition>;
  deleteExhibition: (id: string) => Promise<void>;
  setFilters: (filters: Partial<UseExhibitionsParams>) => void;
}

const useExhibitions = (params: UseExhibitionsParams = {}): UseExhibitionsReturn => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalExhibitions, setTotalExhibitions] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(params.page || 1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [filters, setFiltersState] = useState<UseExhibitionsParams>({
    curator: params.curator,
    isActive: params.isActive,
    search: params.search,
    limit: params.limit || 10,
    autoFetch: params.autoFetch !== false, // Default to true
  });

  // Update filters
  const setFilters = useCallback((newFilters: Partial<UseExhibitionsParams>) => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      ...newFilters,
    }));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, []);

  // Fetch exhibitions
  const fetchExhibitions = useCallback(async (page: number = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const { exhibitions: fetchedExhibitions, pagination } = await api.getExhibitions({
        ...filters,
        page,
      });

      setExhibitions(fetchedExhibitions);
      setTotalExhibitions(pagination.total);
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
      await fetchExhibitions(currentPage + 1);
    }
  }, [currentPage, totalPages, fetchExhibitions]);

  // Fetch previous page
  const fetchPreviousPage = useCallback(async () => {
    if (currentPage > 1) {
      await fetchExhibitions(currentPage - 1);
    }
  }, [currentPage, fetchExhibitions]);

  // Create exhibition
  const createExhibition = useCallback(async (data: ExhibitionCreateData): Promise<Exhibition> => {
    try {
      const newExhibition = await api.createExhibition(data);
      // Refresh exhibitions after creation if needed
      if (filters.autoFetch) {
        await fetchExhibitions();
      }
      return newExhibition;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [filters.autoFetch, fetchExhibitions]);

  // Update exhibition
  const updateExhibition = useCallback(async (id: string, data: ExhibitionUpdateData): Promise<Exhibition> => {
    try {
      const updatedExhibition = await api.updateExhibition(id, data);
      // Update exhibition in state
      setExhibitions(prevExhibitions => 
        prevExhibitions.map(exhibition => 
          exhibition.id === id ? updatedExhibition : exhibition
        )
      );
      return updatedExhibition;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete exhibition
  const deleteExhibition = useCallback(async (id: string): Promise<void> => {
    try {
      await api.deleteExhibition(id);
      // Remove exhibition from state
      setExhibitions(prevExhibitions => 
        prevExhibitions.filter(exhibition => exhibition.id !== id)
      );
      // Refresh exhibitions if needed
      if (filters.autoFetch) {
        await fetchExhibitions();
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [filters.autoFetch, fetchExhibitions]);

  // Fetch exhibitions on mount and when dependencies change
  useEffect(() => {
    if (filters.autoFetch) {
      fetchExhibitions();
    }
  }, [filters.curator, filters.isActive, filters.search, filters.limit, fetchExhibitions, filters.autoFetch]);

  return {
    exhibitions,
    loading,
    error,
    totalExhibitions,
    currentPage,
    totalPages,
    fetchExhibitions,
    fetchNextPage,
    fetchPreviousPage,
    createExhibition,
    updateExhibition,
    deleteExhibition,
    setFilters,
  };
};

export default useExhibitions;