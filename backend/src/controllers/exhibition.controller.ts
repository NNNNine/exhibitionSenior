// backend/src/controllers/exhibition.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppDataSource } from '../config/database';
import { Exhibition } from '../entities/Exhibition';
import { Wall } from '../entities/Wall';
import { ArtworkPlacement, PlacementPosition } from '../entities/ArtworkPlacement';
import { Artwork, ArtworkStatus } from '../entities/Artwork';
import { UserRole } from '../entities/User';
import { logger } from '../utils/logger';

/**
 * Get the active exhibition with all walls and artwork placements
 * @route GET /api/exhibition
 */
export const getExhibition = async (_req: Request, res: Response): Promise<void> => {
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
      res.status(404).json({ message: 'No exhibition found' });
      return;
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
    
    res.status(200).json(exhibition);
  } catch (error) {
    logger.error('Get exhibition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create or update the exhibition
 * @route POST /api/exhibition
 */
export const createOrUpdateExhibition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only curators and admins can create or update exhibitions
    if (!req.user || (req.user.role !== UserRole.CURATOR && req.user.role !== UserRole.ADMIN)) {
      res.status(403).json({ message: 'Only curators can create exhibitions' });
      return;
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
    exhibition.title = req.body.title;
    exhibition.description = req.body.description;
    exhibition.curator = req.user;
    exhibition.curatorId = req.user.id;
    exhibition.startDate = new Date(req.body.startDate);
    exhibition.endDate = new Date(req.body.endDate);
    exhibition.isActive = req.body.isActive || false;
    
    const savedExhibition = await exhibitionRepository.save(exhibition);
    
    res.status(200).json(savedExhibition);
  } catch (error) {
    logger.error('Create/update exhibition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all walls for the exhibition
 * @route GET /api/exhibition/walls
 */
export const getWalls = async (_req: Request, res: Response): Promise<void> => {
  try {
    const wallRepository = AppDataSource.getRepository(Wall);
    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    
    // Get the active exhibition (or the most recently created one if none is active)
    const exhibition = await exhibitionRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' }
    });
    
    if (!exhibition) {
      res.status(404).json({ message: 'No exhibition found' });
      return;
    }
    
    // Get all walls for the exhibition
    const walls = await wallRepository.find({
      where: { exhibitionId: exhibition.id },
      order: { displayOrder: 'ASC' },
      relations: ['placements', 'placements.artwork', 'placements.artwork.artist']
    });
    
    res.status(200).json(walls);
  } catch (error) {
    logger.error('Get walls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new wall in the exhibition
 * @route POST /api/exhibition/walls
 */
export const createWall = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only curators and admins can create walls
    if (!req.user || (req.user.role !== UserRole.CURATOR && req.user.role !== UserRole.ADMIN)) {
      res.status(403).json({ message: 'Only curators can create walls' });
      return;
    }
    
    const wallRepository = AppDataSource.getRepository(Wall);
    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    
    // Get the current exhibition
    const exhibition = await exhibitionRepository.findOne({
      order: { createdAt: 'DESC' }
    });
    
    if (!exhibition) {
      res.status(404).json({ message: 'No exhibition found. Create an exhibition first.' });
      return;
    }
    
    // Find the highest display order of existing walls
    const lastWall = await wallRepository.findOne({
      where: { exhibitionId: exhibition.id },
      order: { displayOrder: 'DESC' }
    });
    
    const newDisplayOrder = lastWall ? lastWall.displayOrder + 1 : 0;
    
    // Create the new wall
    const wall = new Wall();
    wall.name = req.body.name;
    wall.displayOrder = newDisplayOrder;
    wall.exhibition = exhibition;
    wall.exhibitionId = exhibition.id;
    
    const savedWall = await wallRepository.save(wall);
    
    res.status(201).json(savedWall);
  } catch (error) {
    logger.error('Create wall error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a wall
 * @route PUT /api/exhibition/walls/:id
 */
export const updateWall = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only curators and admins can update walls
    if (!req.user || (req.user.role !== UserRole.CURATOR && req.user.role !== UserRole.ADMIN)) {
      res.status(403).json({ message: 'Only curators can update walls' });
      return;
    }
    
    const wallRepository = AppDataSource.getRepository(Wall);
    
    // Find the wall
    const wall = await wallRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!wall) {
      res.status(404).json({ message: 'Wall not found' });
      return;
    }
    
    // Update the wall
    wall.name = req.body.name || wall.name;
    if (req.body.displayOrder !== undefined) {
      wall.displayOrder = req.body.displayOrder;
    }
    
    const savedWall = await wallRepository.save(wall);
    
    res.status(200).json(savedWall);
  } catch (error) {
    logger.error('Update wall error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a wall
 * @route DELETE /api/exhibition/walls/:id
 */
export const deleteWall = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only curators and admins can delete walls
    if (!req.user || (req.user.role !== UserRole.CURATOR && req.user.role !== UserRole.ADMIN)) {
      res.status(403).json({ message: 'Only curators can delete walls' });
      return;
    }
    
    const wallRepository = AppDataSource.getRepository(Wall);
    
    // Find the wall
    const wall = await wallRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!wall) {
      res.status(404).json({ message: 'Wall not found' });
      return;
    }
    
    // Delete the wall
    await wallRepository.remove(wall);
    
    res.status(200).json({ message: 'Wall deleted successfully' });
  } catch (error) {
    logger.error('Delete wall error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update the layout of artworks on a wall
 * @route POST /api/exhibition/walls/:id/layout
 */
export const updateWallLayout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only curators and admins can update layouts
    if (!req.user || (req.user.role !== UserRole.CURATOR && req.user.role !== UserRole.ADMIN)) {
      res.status(403).json({ message: 'Only curators can update layouts' });
      return;
    }
    
    const wallRepository = AppDataSource.getRepository(Wall);
    // const artworkPlacementRepository = AppDataSource.getRepository(ArtworkPlacement);
    const artworkRepository = AppDataSource.getRepository(Artwork);
    
    // Find the wall
    const wall = await wallRepository.findOne({
      where: { id: req.params.id },
      relations: ['placements']
    });
    
    if (!wall) {
      res.status(404).json({ message: 'Wall not found' });
      return;
    }
    
    // Start a transaction
    await AppDataSource.transaction(async transactionalEntityManager => {
      // Remove all existing placements for this wall
      if (wall.placements && wall.placements.length > 0) {
        await transactionalEntityManager.remove(wall.placements);
      }
      
      // Create new placements from the request
      const placements = req.body.placements;
      
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
    });
    
    // Get the updated wall with its placements
    const updatedWall = await wallRepository.findOne({
      where: { id: wall.id },
      relations: ['placements', 'placements.artwork', 'placements.artwork.artist']
    });
    
    res.status(200).json(updatedWall);
  } catch (error) {
    logger.error('Update wall layout error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
  }
};

/**
 * Get all approved artworks for placement (curator's stockpile)
 * @route GET /api/exhibition/stockpile
 */
export const getArtworksForPlacement = async (_req: Request, res: Response): Promise<void> => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    
    // Get all approved artworks
    const artworks = await artworkRepository.find({
      where: { status: ArtworkStatus.APPROVED },
      relations: ['artist']
    });
    // console.log('artworks', artworks);
    res.status(200).json(artworks);
  } catch (error) {
    logger.error('Get artworks for placement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};