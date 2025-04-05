// src/controllers/exhibition.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppDataSource } from '../config/database';
import { Exhibition } from '../entities/Exhibition';
import { ExhibitionItem } from '../entities/ExhibitionItem';
import { Artwork } from '../entities/Artwork';
import { UserRole } from '../entities/User';
import { logger } from '../utils/logger';

/**
 * Get all exhibitions with filtering and pagination
 * @route GET /api/exhibitions
 */
export const getAllExhibitions = async (req: Request, res: Response): Promise<void> => {
  try {
    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    
    // Extract query parameters for filtering
    const { 
      curator, 
      isActive,
      search,
      page = 1,
      limit = 10
    } = req.query;
    
    let query = exhibitionRepository
      .createQueryBuilder('exhibition')
      .leftJoinAndSelect('exhibition.curator', 'curator')
      .orderBy('exhibition.startDate', 'DESC');
    
    if (curator) {
      query = query.andWhere('curator.username = :curator', { curator });
    }
    
    if (isActive !== undefined) {
      query = query.andWhere('exhibition.isActive = :isActive', { isActive });
    }
    
    if (search) {
      query = query.andWhere(
        '(exhibition.title ILIKE :search OR exhibition.description ILIKE :search)', 
        { search: `%${search}%` }
      );
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    query = query.skip(skip).take(Number(limit));
    
    const [exhibitions, total] = await query.getManyAndCount();
    
    res.status(200).json({
      exhibitions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get all exhibitions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get exhibition by ID
 * @route GET /api/exhibitions/:id
 */
export const getExhibitionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    const exhibition = await exhibitionRepository.findOne({
      where: { id: req.params.id },
      relations: ['curator', 'items', 'items.artwork', 'items.artwork.artist']
    });
    
    if (!exhibition) {
      res.status(404).json({ message: 'Exhibition not found' });
      return;
    }
    
    res.status(200).json(exhibition);
  } catch (error) {
    logger.error('Get exhibition by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create new exhibition
 * @route POST /api/exhibitions
 */
export const createExhibition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only curators and admins can create exhibitions
    if (!req.user || (req.user.role !== UserRole.CURATOR && req.user.role !== UserRole.ADMIN)) {
      res.status(403).json({ message: 'Only curators can create exhibitions' });
      return
    }
    
    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    const exhibition = new Exhibition();
    
    exhibition.title = req.body.title;
    exhibition.description = req.body.description;
    exhibition.curator = req.user;
    exhibition.curatorId = req.user.id;
    exhibition.startDate = new Date(req.body.startDate);
    exhibition.endDate = new Date(req.body.endDate);
    exhibition.isActive = req.body.isActive || false;
    
    const savedExhibition = await exhibitionRepository.save(exhibition);
    
    res.status(201).json(savedExhibition);
  } catch (error) {
    logger.error('Create exhibition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update exhibition
 * @route PUT /api/exhibitions/:id
 */
export const updateExhibition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return
    }

    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    const exhibition = await exhibitionRepository.findOne({
      where: { id: req.params.id },
      relations: ['curator']
    });
    
    if (!exhibition) {
      res.status(404).json({ message: 'Exhibition not found' });
      return
    }
    
    // Check if user is the curator or an admin
    if (
      exhibition.curator.id !== req.user.id &&
      req.user.role !== UserRole.ADMIN
    ) {
      res.status(403).json({ message: 'Not authorized to update this exhibition' });
      return
    }
    
    // Update exhibition fields
    if (req.body.title !== undefined) exhibition.title = req.body.title;
    if (req.body.description !== undefined) exhibition.description = req.body.description;
    if (req.body.startDate !== undefined) exhibition.startDate = new Date(req.body.startDate);
    if (req.body.endDate !== undefined) exhibition.endDate = new Date(req.body.endDate);
    if (req.body.isActive !== undefined) exhibition.isActive = req.body.isActive;
    
    const updatedExhibition = await exhibitionRepository.save(exhibition);
    
    res.status(200).json(updatedExhibition);
  } catch (error) {
    logger.error('Update exhibition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete exhibition
 * @route DELETE /api/exhibitions/:id
 */
export const deleteExhibition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return
    }

    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    const exhibition = await exhibitionRepository.findOne({
      where: { id: req.params.id },
      relations: ['curator']
    });
    
    if (!exhibition) {
      res.status(404).json({ message: 'Exhibition not found' });
      return
    }
    
    // Check if user is the curator or an admin
    if (
      exhibition.curator.id !== req.user.id &&
      req.user.role !== UserRole.ADMIN
    ) {
      res.status(403).json({ message: 'Not authorized to delete this exhibition' });
      return
    }
    
    await exhibitionRepository.remove(exhibition);
    
    res.status(200).json({ message: 'Exhibition deleted successfully' });
  } catch (error) {
    logger.error('Delete exhibition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Add artwork to exhibition
 * @route POST /api/exhibitions/:id/items
 */
export const addArtworkToExhibition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return
    }

    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    const exhibition = await exhibitionRepository.findOne({
      where: { id: req.params.id },
      relations: ['curator', 'items']
    });
    
    if (!exhibition) {
      res.status(404).json({ message: 'Exhibition not found' });
      return
    }
    
    // Check if user is the curator or an admin
    if (
      exhibition.curator.id !== req.user.id &&
      req.user.role !== UserRole.ADMIN
    ) {
      res.status(403).json({ message: 'Not authorized to modify this exhibition' });
      return
    }
    
    // Check if artwork exists
    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = await artworkRepository.findOne({
      where: { id: req.body.artworkId }
    });
    
    if (!artwork) {
      res.status(404).json({ message: 'Artwork not found' });
      return 
    }
    
    // Check if artwork is already in exhibition
    const existingItem = exhibition.items.find(item => item.artworkId === req.body.artworkId);
    if (existingItem) {
      res.status(400).json({ message: 'Artwork is already in this exhibition' });
      return 
    }
    
    // Create new exhibition item
    const exhibitionItemRepository = AppDataSource.getRepository(ExhibitionItem);
    const exhibitionItem = new ExhibitionItem();
    
    exhibitionItem.exhibition = exhibition;
    exhibitionItem.exhibitionId = exhibition.id;
    exhibitionItem.artwork = artwork;
    exhibitionItem.artworkId = artwork.id;
    exhibitionItem.position = req.body.position;
    exhibitionItem.rotation = req.body.rotation;
    exhibitionItem.scale = req.body.scale;
    
    const savedItem = await exhibitionItemRepository.save(exhibitionItem);
    
    res.status(201).json(savedItem);
  } catch (error) {
    logger.error('Add artwork to exhibition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update exhibition item
 * @route PUT /api/exhibitions/:id/items/:itemId
 */
export const updateExhibitionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return 
    }

    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    const exhibition = await exhibitionRepository.findOne({
      where: { id: req.params.id },
      relations: ['curator']
    });
    
    if (!exhibition) {
      res.status(404).json({ message: 'Exhibition not found' });
      return 
    }
    
    // Check if user is the curator or an admin
    if (
      exhibition.curator.id !== req.user.id &&
      req.user.role !== UserRole.ADMIN
    ) {
      res.status(403).json({ message: 'Not authorized to modify this exhibition' });
      return 
    }
    
    // Check if exhibition item exists
    const exhibitionItemRepository = AppDataSource.getRepository(ExhibitionItem);
    const exhibitionItem = await exhibitionItemRepository.findOne({
      where: { 
        id: req.params.itemId,
        exhibitionId: req.params.id
      }
    });
    
    if (!exhibitionItem) {
      res.status(404).json({ message: 'Exhibition item not found' });
      return 
    }
    
    // Update exhibition item fields
    if (req.body.position) exhibitionItem.position = req.body.position;
    if (req.body.rotation) exhibitionItem.rotation = req.body.rotation;
    if (req.body.scale) exhibitionItem.scale = req.body.scale;
    
    const updatedItem = await exhibitionItemRepository.save(exhibitionItem);
    
    res.status(200).json(updatedItem);
  } catch (error) {
    logger.error('Update exhibition item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Remove artwork from exhibition
 * @route DELETE /api/exhibitions/:id/items/:itemId
 */
export const removeArtworkFromExhibition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return 
    }

    const exhibitionRepository = AppDataSource.getRepository(Exhibition);
    const exhibition = await exhibitionRepository.findOne({
      where: { id: req.params.id },
      relations: ['curator']
    });
    
    if (!exhibition) {
      res.status(404).json({ message: 'Exhibition not found' });
      return 
    }
    
    // Check if user is the curator or an admin
    if (
      exhibition.curator.id !== req.user.id &&
      req.user.role !== UserRole.ADMIN
    ) {
      res.status(403).json({ message: 'Not authorized to modify this exhibition' });
      return 
    }
    
    // Check if exhibition item exists
    const exhibitionItemRepository = AppDataSource.getRepository(ExhibitionItem);
    const exhibitionItem = await exhibitionItemRepository.findOne({
      where: { 
        id: req.params.itemId,
        exhibitionId: req.params.id
      }
    });
    
    if (!exhibitionItem) {
      res.status(404).json({ message: 'Exhibition item not found' });
      return 
    }
    
    await exhibitionItemRepository.remove(exhibitionItem);
    
    res.status(200).json({ message: 'Artwork removed from exhibition successfully' });
  } catch (error) {
    logger.error('Remove artwork from exhibition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};