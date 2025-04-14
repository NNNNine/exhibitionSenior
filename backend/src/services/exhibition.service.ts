import { ArtworkPlacement, PlacementPosition } from '../entities/ArtworkPlacement';
import { Exhibition } from '../entities/Exhibition';
import { User, UserRole } from '../entities/User';
import { Wall } from '../entities/Wall';
import { Artwork, ArtworkStatus } from '../entities/Artwork';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Get the active exhibition with all walls and artwork placements
 */
export const getExhibition = async () => {
  try {
    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    
    // Get the active exhibition (or the most recently created one if none is active)
    let exhibition = await exhibitionRepository.findOne({
      where: { isActive: true },
      relations: ['curator', 'walls', 'walls.placements', 'walls.placements.artwork', 'walls.placements.artwork.artist']
    });
    
    if (!exhibition) {
      // Find the most recent exhibition if none is active
      exhibition = await exhibitionRepository.findOne({
        order: { createdAt: 'DESC' },
        relations: ['curator', 'walls', 'walls.placements', 'walls.placements.artwork', 'walls.placements.artwork.artist']
      });
    }
    
    if (!exhibition) {
      throw new Error('No exhibition found');
    }
    
    // Sort the walls by display order
    if (exhibition.walls) {
      exhibition.walls.sort((a, b) => a.displayOrder - b.displayOrder);
      
      // For each wall, make sure the placements are ordered by position
      exhibition.walls.forEach(wall => {
        if (wall.placements) {
          // Custom sort logic for positions (left, center, right, custom)
          wall.placements.sort((a, b) => {
            const positionOrder = {
              [PlacementPosition.LEFT]: 0,
              [PlacementPosition.CENTER]: 1,
              [PlacementPosition.RIGHT]: 2,
              [PlacementPosition.CUSTOM]: 3
            };
            return positionOrder[a.position] - positionOrder[b.position];
          });
        }
      });
    }
    
    return exhibition;
  } catch (error) {
    logger.error('Get exhibition error:', error);
    throw error;
  }
};

/**
 * Create or update the exhibition
 */
export const createOrUpdateExhibition = async (
  user: User,
  title: string,
  description: string,
  startDate: string,
  endDate: string,
  isActive?: boolean
) => {
  try {
    // Only curators and admins can create or update exhibitions
    if (user.role !== UserRole.CURATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Only curators can create exhibitions');
    }
    
    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    
    // Find existing exhibition
    let exhibition = await exhibitionRepository.findOne({
      where: { isActive: true }
    });
    
    if (!exhibition) {
      // Create new exhibition if none exists
      exhibition = new Exhibition();
    }
    
    // Update exhibition fields
    exhibition.title = title;
    exhibition.description = description;
    exhibition.curator = user;
    exhibition.curatorId = user.id;
    exhibition.startDate = new Date(startDate);
    exhibition.endDate = new Date(endDate);
    exhibition.isActive = isActive || false;
    
    const savedExhibition = await exhibitionRepository.save(exhibition);
    
    return savedExhibition;
  } catch (error) {
    logger.error('Create/update exhibition error:', error);
    throw error;
  }
};

/**
 * Get all walls for the exhibition
 */
export const getWalls = async () => {
  try {
    const wallRepository = AppDataSource.getRepository(Wall);
    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    
    // Get the active exhibition (or the most recently created one if none is active)
    const exhibition = await exhibitionRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' }
    });
    
    if (!exhibition) {
      throw new Error('No exhibition found');
    }
    
    // Get all walls for the exhibition
    const walls = await wallRepository.find({
      where: { exhibitionId: exhibition.id },
      order: { displayOrder: 'ASC' },
      relations: ['placements', 'placements.artwork', 'placements.artwork.artist']
    });
    
    return walls;
  } catch (error) {
    logger.error('Get walls error:', error);
    throw error;
  }
};

/**
 * Create a new wall in the exhibition
 */
export const createWall = async (user: User, name: string) => {
  try {
    // Only curators and admins can create walls
    if (user.role !== UserRole.CURATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Only curators can create walls');
    }
    
    const wallRepository = AppDataSource.getRepository(Wall);
    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    
    // Get the current exhibition
    const exhibition = await exhibitionRepository.findOne({
      where: { isActive: true },
    });
    
    if (!exhibition) {
      throw new Error('No exhibition found. Create an exhibition first.');
    }
    
    // Find the highest display order of existing walls
    const lastWall = await wallRepository.findOne({
      where: { exhibitionId: exhibition.id },
      order: { displayOrder: 'DESC' }
    });
    
    const newDisplayOrder = lastWall ? lastWall.displayOrder + 1 : 0;
    
    // Create the new wall
    const wall = new Wall();
    wall.name = name;
    wall.displayOrder = newDisplayOrder;
    wall.exhibition = exhibition;
    wall.exhibitionId = exhibition.id;
    
    const savedWall = await wallRepository.save(wall);
    
    return savedWall;
  } catch (error) {
    logger.error('Create wall error:', error);
    throw error;
  }
};

/**
 * Update a wall
 */
export const updateWall = async (
  user: User,
  wallId: string,
  updates: {
    name?: string;
    displayOrder?: number;
  }
) => {
  try {
    // Only curators and admins can update walls
    if (user.role !== UserRole.CURATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Only curators can update walls');
    }
    
    const wallRepository = AppDataSource.getRepository(Wall);
    
    // Find the wall
    const wall = await wallRepository.findOne({
      where: { id: wallId }
    });
    
    if (!wall) {
      throw new Error('Wall not found');
    }
    
    // Update the wall
    if (updates.name) wall.name = updates.name;
    if (updates.displayOrder !== undefined) {
      wall.displayOrder = updates.displayOrder;
    }
    
    const savedWall = await wallRepository.save(wall);
    
    return savedWall;
  } catch (error) {
    logger.error('Update wall error:', error);
    throw error;
  }
};

/**
 * Delete a wall
 */
export const deleteWall = async (user: User, wallId: string) => {
  try {
    // Only curators and admins can delete walls
    if (user.role !== UserRole.CURATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Only curators can delete walls');
    }
    
    const wallRepository = AppDataSource.getRepository(Wall);
    
    // Find the wall
    const wall = await wallRepository.findOne({
      where: { id: wallId }
    });
    
    if (!wall) {
      throw new Error('Wall not found');
    }
    
    // Delete the wall
    await wallRepository.remove(wall);
    
    return { success: true, message: 'Wall deleted successfully' };
  } catch (error) {
    logger.error('Delete wall error:', error);
    throw error;
  }
};

/**
 * Update the layout of artworks on a wall
 */
export const updateWallLayout = async (
  user: User,
  wallId: string,
  placements: Array<{
    artworkId: string;
    position?: PlacementPosition;
    coordinates?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
  }>
) => {
  try {
    // Only curators and admins can update layouts
    if (user.role !== UserRole.CURATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Only curators can update layouts');
    }
    
    const wallRepository = AppDataSource.getRepository(Wall);
    const artworkRepository = AppDataSource.getRepository(Artwork);
    
    // Find the wall
    const wall = await wallRepository.findOne({
      where: { id: wallId },
      relations: ['placements']
    });
    
    if (!wall) {
      throw new Error('Wall not found');
    }
    
    // Start a transaction
    return await AppDataSource.transaction(async transactionalEntityManager => {
      // Remove all existing placements for this wall
      if (wall.placements && wall.placements.length > 0) {
        await transactionalEntityManager.remove(wall.placements);
      }
      
      // Create new placements from the request
      if (!placements || !Array.isArray(placements)) {
        throw new Error('Invalid placement data');
      }
      
      const newPlacements: ArtworkPlacement[] = [];
      
      for (const placementData of placements) {
        // Verify the artwork exists and is approved
        const artwork = await artworkRepository.findOne({
          where: { 
            id: placementData.artworkId,
            status: ArtworkStatus.APPROVED
          }
        });
        
        if (!artwork) {
          throw new Error(`Artwork with ID ${placementData.artworkId} not found or not approved`);
        }
        
        const placement = new ArtworkPlacement();
        placement.wall = wall;
        placement.wallId = wall.id;
        placement.artwork = artwork;
        placement.artworkId = artwork.id;
        placement.position = placementData.position || PlacementPosition.CUSTOM;
        
        if (placementData.coordinates) {
          placement.coordinates = placementData.coordinates;
        }
        
        if (placementData.rotation) {
          placement.rotation = placementData.rotation;
        }
        
        if (placementData.scale) {
          placement.scale = placementData.scale;
        }
        
        newPlacements.push(placement);
      }
      
      // Save all new placements
      await transactionalEntityManager.save(newPlacements);
      
      // Get the updated wall with its placements
      const updatedWall = await wallRepository.findOne({
        where: { id: wall.id },
        relations: ['placements', 'placements.artwork', 'placements.artwork.artist']
      });
      
      return updatedWall;
    });
  } catch (error) {
    logger.error('Update wall layout error:', error);
    throw error;
  }
};

/**
 * Get all approved artworks for placement (curator's stockpile)
 */
export const getArtworksForPlacement = async () => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    
    // Get all approved artworks
    const artworks = await artworkRepository.find({
      where: { status: ArtworkStatus.APPROVED },
      relations: ['artist']
    });
    
    return artworks;
  } catch (error) {
    logger.error('Get artworks for placement error:', error);
    throw error;
  }
};

/**
 * Get walls with their images by exhibition ID
 */
export const getWallsWithImages = async (exhibitionId: string) => {
  try {
    const walls = await AppDataSource.getRepository(Wall).find({
      where: { exhibitionId },
      relations: ['placements', 'placements.artwork'],
      order: {
        displayOrder: 'ASC'
      }
    });

    const wallResults = walls.map(wall => {
      const images: Record<'left' | 'center' | 'right', string | null> = {
        left: null,
        center: null,
        right: null
      };

      wall.placements.forEach(placement => {
        if (
          placement.position === PlacementPosition.LEFT ||
          placement.position === PlacementPosition.CENTER ||
          placement.position === PlacementPosition.RIGHT
        ) {
          images[placement.position] = placement.artwork?.fileUrl || null;
        }
      });

      return {
        wallId: wall.id,
        name: wall.name,
        images
      };
    });

    return wallResults;
  } catch (error) {
    logger.error('Get walls with images error:', error);
    throw error;
  }
};