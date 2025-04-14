// backend/src/services/artwork.service.ts
import { AppDataSource } from '../config/database';
import { Artwork, ArtworkStatus } from '../entities/Artwork';
import { User, UserRole } from '../entities/User';
import { logger } from '../utils/logger';
import { processArtworkImage } from './upload.service';
import { notifyArtworkUpload, notifyArtworkApproval } from './notification.service';
import path from 'path';
import fs from 'fs';

/**
 * Get all artworks with filtering and pagination
 */
export const getAllArtworks = async (
  category?: string,
  artist?: string,
  tags?: string,
  search?: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    
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
      const tagArray = tags.split(',');
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
    
    return {
      artworks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };
  } catch (error) {
    logger.error('Get all artworks error:', error);
    throw error;
  }
};

/**
 * Get artwork by ID
 */
export const getArtworkById = async (id: string) => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = await artworkRepository.findOne({
      where: { id },
      relations: ['artist', 'comments', 'comments.user']
    });
    
    if (!artwork) {
      throw new Error('Artwork not found');
    }
    
    return artwork;
  } catch (error) {
    logger.error('Get artwork by ID error:', error);
    throw error;
  }
};

/**
 * Create new artwork
 */
export const createArtwork = async (
  title: string,
  description: string,
  artist: User,
  category: string,
  tagsString?: string,
  creationDate?: string,
  file?: Express.Multer.File,
  io?: any
) => {
  try {
    // Check if file was uploaded
    if (!file) {
      throw new Error('No file uploaded');
    }
    
    // Process the uploaded artwork image
    const { originalPath, thumbnailPath } = await processArtworkImage(file);
    
    // Create new artwork record
    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = new Artwork();
    
    artwork.title = title;
    artwork.description = description;
    artwork.artist = artist;
    artwork.artistId = artist.id;
    artwork.fileUrl = originalPath.replace(path.join(__dirname, '../../../'), '/');
    artwork.thumbnailUrl = thumbnailPath.replace(path.join(__dirname, '../../../'), '/');
    artwork.category = category;
    artwork.tags = tagsString ? JSON.parse(tagsString) : [];
    artwork.creationDate = new Date(creationDate || Date.now());
    
    const savedArtwork = await artworkRepository.save(artwork);
    
    // Create notifications for curators
    await notifyArtworkUpload(
      savedArtwork.id,
      savedArtwork.title,
      artist.id,
      artist.username
    );
    
    // Emit socket event for real-time notification
    if (io) {
      io.emit('new-artwork', {
        id: savedArtwork.id,
        title: savedArtwork.title,
        artist: artist.username,
        artistId: artist.id,
        thumbnailUrl: savedArtwork.thumbnailUrl
      });
    }
    
    return savedArtwork;
  } catch (error) {
    logger.error('Create artwork error:', error);
    throw error;
  }
};

/**
 * Update artwork
 */
export const updateArtwork = async (
  id: string,
  user: User,
  updates: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string;
  },
  file?: Express.Multer.File
) => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = await artworkRepository.findOne({
      where: { id },
      relations: ['artist']
    });
    
    if (!artwork) {
      throw new Error('Artwork not found');
    }
    
    // Check if user is the artist or an admin
    if (
      artwork.artist.id !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new Error('Not authorized to update this artwork');
    }
    
    // Update artwork fields
    if (updates.title) artwork.title = updates.title;
    if (updates.description) artwork.description = updates.description;
    if (updates.category) artwork.category = updates.category;
    
    if (updates.tags) {
      artwork.tags = JSON.parse(updates.tags);
    }
    
    // Handle file upload if a new file is provided
    if (file) {
      // Process the uploaded artwork image
      const { originalPath, thumbnailPath } = await processArtworkImage(file);
      
      // Update file paths
      artwork.fileUrl = originalPath.replace(path.join(__dirname, '../../../'), '/');
      artwork.thumbnailUrl = thumbnailPath.replace(path.join(__dirname, '../../../'), '/');
    }
    
    const updatedArtwork = await artworkRepository.save(artwork);
    
    return updatedArtwork;
  } catch (error) {
    logger.error('Update artwork error:', error);
    throw error;
  }
};

/**
 * Delete artwork
 */
export const deleteArtwork = async (id: string, user: User) => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = await artworkRepository.findOne({
      where: { id },
      relations: ['artist']
    });
    
    if (!artwork) {
      throw new Error('Artwork not found');
    }
    
    // Check if user is the artist or an admin
    if (
      artwork.artist.id !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new Error('Not authorized to delete this artwork');
    }
    
    // Delete associated files
    const basePath = path.join(__dirname, '../../../');
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
    
    return { success: true, message: 'Artwork deleted successfully' };
  } catch (error) {
    logger.error('Delete artwork error:', error);
    throw error;
  }
};

/**
 * Approve an artwork
 */
export const approveArtwork = async (id: string, user: User, io?: any) => {
  try {
    if (user.role !== UserRole.CURATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Only curators and admins can approve artworks');
    }

    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = await artworkRepository.findOne({
      where: { id },
      relations: ['artist']
    });
    
    if (!artwork) {
      throw new Error('Artwork not found');
    }
    
    // Update artwork status
    artwork.status = ArtworkStatus.APPROVED;
    await artworkRepository.save(artwork);
    
    // Create notification for the artist
    await notifyArtworkApproval(
      artwork.id,
      artwork.title,
      artwork.artistId,
      user.username
    );
    
    // Emit socket event for real-time notification
    if (io) {
      io.to(artwork.artistId).emit('artwork-approved', {
        id: artwork.id,
        title: artwork.title,
        curatorName: user.username
      });
    }
    
    return { success: true, message: 'Artwork approved successfully' };
  } catch (error) {
    logger.error('Approve artwork error:', error);
    throw error;
  }
};

/**
 * Reject an artwork
 */
export const rejectArtwork = async (id: string, user: User, io?: any) => {
  try {
    if (user.role !== UserRole.CURATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Only curators and admins can reject artworks');
    }

    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = await artworkRepository.findOne({
      where: { id },
      relations: ['artist']
    });
    
    if (!artwork) {
      throw new Error('Artwork not found');
    }
    
    // Update artwork status
    artwork.status = ArtworkStatus.REJECTED;
    await artworkRepository.save(artwork);
    
    // Create notification for the artist
    await notifyArtworkApproval(
      artwork.id,
      artwork.title,
      artwork.artistId,
      user.username
    );
    
    // Emit socket event for real-time notification
    if (io) {
      io.to(artwork.artistId).emit('artwork-rejected', {
        id: artwork.id,
        title: artwork.title,
        curatorName: user.username
      });
    }
    
    return { success: true, message: 'Artwork rejected successfully' };
  } catch (error) {
    logger.error('Reject artwork error:', error);
    throw error;
  }
};

export const getArtworkInfoById = async (id: string) => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    const artwork = await artworkRepository.findOne({
      where: { id },
      relations: ['artist']
    });
    
    if (!artwork) {
      throw new Error('Artwork not found');
    }
    
    return {
      id: artwork.id,
      title: artwork.title,
      artist: artwork.artist.username,
      description: artwork.description,
    };
  } catch (error) {
    logger.error('Get artwork info by ID error:', error);
    throw error;
  }
}