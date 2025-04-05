import { useState, useEffect, useCallback } from 'react';
import { Exhibition } from '@/types/exhibition.types';
import { Artwork, ExhibitionItem } from '@/types/artwork.types';
import * as api from '@/lib/api';

interface ArtworkWithPosition extends Partial<Artwork> {
  position?: ExhibitionItem['position'];
  rotation?: ExhibitionItem['rotation'];
  scale?: ExhibitionItem['scale'];
  itemId?: string;
  id: string; // Ensure id is required and a string
}

interface UseExhibitionDetailReturn {
  exhibition: Exhibition | null;
  artworks: ArtworkWithPosition[];
  loading: boolean;
  error: string | null;
  fetchExhibition: () => Promise<void>;
  addArtwork: (
    artworkId: string,
    position: { x: number, y: number, z: number },
    rotation: { x: number, y: number, z: number },
    scale: { x: number, y: number, z: number }
  ) => Promise<ExhibitionItem>;
  updateArtworkPosition: (
    itemId: string,
    data: {
      position?: { x: number, y: number, z: number },
      rotation?: { x: number, y: number, z: number },
      scale?: { x: number, y: number, z: number }
    }
  ) => Promise<ExhibitionItem>;
  removeArtwork: (itemId: string) => Promise<void>;
}

const useExhibitionDetail = (exhibitionId: string): UseExhibitionDetailReturn => {
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [artworks, setArtworks] = useState<ArtworkWithPosition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch exhibition details
  const fetchExhibition = useCallback(async () => {
    if (!exhibitionId) return;
    
    setLoading(true);
    setError(null);

    try {
      const fetchedExhibition = await api.getExhibitionById(exhibitionId);
      setExhibition(fetchedExhibition);

      // Process artworks and their positions
      if (fetchedExhibition.items && fetchedExhibition.items.length > 0) {
        // Map exhibition items to artworks with position data
        const processedArtworks = fetchedExhibition.items
          .filter(item => item.artwork && item.artwork.id) // Filter out any items with missing artwork or id
          .map(item => ({
            ...item.artwork,
            position: item.position,
            rotation: item.rotation,
            scale: item.scale,
            itemId: item.id
          })) as ArtworkWithPosition[];
        
        setArtworks(processedArtworks);
      } else {
        setArtworks([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [exhibitionId]);

  // Add artwork to exhibition
  const addArtwork = useCallback(async (
    artworkId: string,
    position: { x: number, y: number, z: number },
    rotation: { x: number, y: number, z: number },
    scale: { x: number, y: number, z: number }
  ): Promise<ExhibitionItem> => {
    if (!exhibitionId) {
      throw new Error('Exhibition ID is required');
    }

    try {
      const newItem = await api.addArtworkToExhibition(
        exhibitionId,
        artworkId,
        position,
        rotation,
        scale
      );

      // Refresh exhibition data
      await fetchExhibition();
      
      return newItem;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [exhibitionId, fetchExhibition]);

  // Update artwork position
  const updateArtworkPosition = useCallback(async (
    itemId: string,
    data: {
      position?: { x: number, y: number, z: number },
      rotation?: { x: number, y: number, z: number },
      scale?: { x: number, y: number, z: number }
    }
  ): Promise<ExhibitionItem> => {
    if (!exhibitionId) {
      throw new Error('Exhibition ID is required');
    }

    try {
      const updatedItem = await api.updateExhibitionItem(
        exhibitionId,
        itemId,
        data
      );

      // Update artworks state with new position
      setArtworks(prevArtworks => 
        prevArtworks.map(artwork => {
          if (artwork.itemId === itemId) {
            return {
              ...artwork,
              position: data.position || artwork.position,
              rotation: data.rotation || artwork.rotation,
              scale: data.scale || artwork.scale
            };
          }
          return artwork;
        })
      );
      
      return updatedItem;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [exhibitionId]);

  // Remove artwork from exhibition
  const removeArtwork = useCallback(async (itemId: string): Promise<void> => {
    if (!exhibitionId) {
      throw new Error('Exhibition ID is required');
    }

    try {
      await api.removeArtworkFromExhibition(exhibitionId, itemId);
      
      // Remove artwork from state
      setArtworks(prevArtworks => 
        prevArtworks.filter(artwork => artwork.itemId !== itemId)
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [exhibitionId]);

  // Fetch exhibition on mount and when ID changes
  useEffect(() => {
    if (exhibitionId) {
      fetchExhibition();
    }
  }, [exhibitionId, fetchExhibition]);

  return {
    exhibition,
    artworks,
    loading,
    error,
    fetchExhibition,
    addArtwork,
    updateArtworkPosition,
    removeArtwork
  };
};

export default useExhibitionDetail;