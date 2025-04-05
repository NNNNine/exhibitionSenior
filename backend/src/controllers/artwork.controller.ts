import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppDataSource } from '../config/database';
import { Artwork } from '../entities/Artwork';
import { UserRole } from '../entities/User';
import { logger } from '../utils/logger';
import { processArtworkImage } from '../services/upload.service';
import path from 'path';
import fs from 'fs';

/**
 * Get all artworks with filtering and pagination
 * @route GET /api/artworks
 */
export const getAllArtworks = async (req: Request, res: Response): Promise<void> => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    
    // Extract query parameters for filtering
    const { 
      category, 
      artist, 
      tags,
      search,
      page = 1,
      limit = 10
    } = req.query;
    
    let query = artworkRepository
      .createQueryBuilder('artwork')
      .leftJoinAndSelect('artwork.artist', 'artist')
      .orderBy('artwork.creationDate', 'DESC');
    
    if (category) {
      query = query.andWhere('artwork.category = :category', { category });
    }
    
    if (artist) {
      query = query.andWhere('artist.username = :artist', { artist });
    }
    
    if (tags) {
      const tagArray = (tags as string).split(',');
      // This is PostgreSQL specific syntax for array contains
      query = query.andWhere('artwork.tags @> :tags', { tags: tagArray });
    }
    
    if (search) {
      query = query.andWhere(
        '(artwork.title ILIKE :search OR artwork.description ILIKE :search)', 
        { search: `%${search}%` }
      );
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    query = query.skip(skip).take(Number(limit));
    
    const [artworks, total] = await query.getManyAndCount();
    
    res.status(200).json({
      artworks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get all artworks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get artwork by ID
 * @route GET /api/artworks/:id
 */
export const getArtworkById = async (req: Request, res: Response): Promise<void> => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = await artworkRepository.findOne({
      where: { id: req.params.id },
      relations: ['artist', 'comments', 'comments.user']
    });
    
    if (!artwork) {
      res.status(404).json({ message: 'Artwork not found' });
      return
    }
    
    res.status(200).json(artwork);
  } catch (error) {
    logger.error('Get artwork by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create new artwork
 * @route POST /api/artworks
 */
export const createArtwork = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only artists can create artworks
    if (!req.user || req.user.role !== UserRole.ARTIST) {
      res.status(403).json({ message: 'Only artists can upload artworks' });
      return;
    }
    
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    
    // Process the uploaded artwork image
    const { originalPath, thumbnailPath } = await processArtworkImage(req.file);
    
    // Create new artwork record
    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = new Artwork();
    
    artwork.title = req.body.title;
    artwork.description = req.body.description;
    artwork.artist = req.user;
    artwork.artistId = req.user.id;
    artwork.fileUrl = originalPath.replace(path.join(__dirname, '../../'), '/');
    artwork.thumbnailUrl = thumbnailPath.replace(path.join(__dirname, '../../'), '/');
    artwork.category = req.body.category;
    artwork.tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    artwork.creationDate = new Date(req.body.creationDate || Date.now());
    
    const savedArtwork = await artworkRepository.save(artwork);
    
    res.status(201).json(savedArtwork);
  } catch (error) {
    logger.error('Create artwork error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update artwork
 * @route PUT /api/artworks/:id
 */
export const updateArtwork = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return
    }

    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = await artworkRepository.findOne({
      where: { id: req.params.id },
      relations: ['artist']
    });
    
    if (!artwork) {
      res.status(404).json({ message: 'Artwork not found' });
      return
    }
    
    // Check if user is the artist or an admin
    if (
      artwork.artist.id !== req.user.id &&
      req.user.role !== UserRole.ADMIN
    ) {
      res.status(403).json({ message: 'Not authorized to update this artwork' });
      return
    }
    
    // Update artwork fields
    artwork.title = req.body.title || artwork.title;
    artwork.description = req.body.description || artwork.description;
    artwork.category = req.body.category || artwork.category;
    
    if (req.body.tags) {
      artwork.tags = JSON.parse(req.body.tags);
    }
    
    // Handle file upload if a new file is provided
    if (req.file) {
      // Process the uploaded artwork image
      const { originalPath, thumbnailPath } = await processArtworkImage(req.file);
      
      // Update file paths
      artwork.fileUrl = originalPath.replace(path.join(__dirname, '../../'), '/');
      artwork.thumbnailUrl = thumbnailPath.replace(path.join(__dirname, '../../'), '/');
    }
    
    const updatedArtwork = await artworkRepository.save(artwork);
    
    res.status(200).json(updatedArtwork);
  } catch (error) {
    logger.error('Update artwork error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete artwork
 * @route DELETE /api/artworks/:id
 */
export const deleteArtwork = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return
    }

    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = await artworkRepository.findOne({
      where: { id: req.params.id },
      relations: ['artist']
    });
    
    if (!artwork) {
      res.status(404).json({ message: 'Artwork not found' });
      return
    }
    
    // Check if user is the artist or an admin
    if (
      artwork.artist.id !== req.user.id &&
      req.user.role !== UserRole.ADMIN
    ) {
      res.status(403).json({ message: 'Not authorized to delete this artwork' });
      return
    }
    
    // Delete associated files
    const basePath = path.join(__dirname, '../../');
    if (artwork.fileUrl) {
      const filePath = path.join(basePath, artwork.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    if (artwork.thumbnailUrl) {
      const thumbnailPath = path.join(basePath, artwork.thumbnailUrl);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
    
    // Delete from database
    await artworkRepository.remove(artwork);
    
    res.status(200).json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    logger.error('Delete artwork error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};