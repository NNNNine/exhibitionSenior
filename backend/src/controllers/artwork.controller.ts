import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../entities/User';
import * as ArtworkService from '../services/artwork.service';
import { handleErrorController } from '../utils/handleErrorController';

export class ArtworkController {
  /**
   * Get all artworks with filtering and pagination
   * @route GET /api/artworks
   */
  async getAllArtworks(req: Request, res: Response): Promise<void> {
    try {
      const { 
        category, 
        artist, 
        tags,
        search,
        page = 1,
        limit = 10
      } = req.query;
      
      const result = await ArtworkService.getAllArtworks(
        category as string | undefined,
        artist as string | undefined,
        tags as string | undefined,
        search as string | undefined,
        Number(page),
        Number(limit)
      );
      
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while getting artworks');
    }
  }

  /**
   * Get artwork by ID
   * @route GET /api/artworks/:id
   */
  async getArtworkById(req: Request, res: Response): Promise<void> {
    try {
      const artwork = await ArtworkService.getArtworkById(req.params.id);
      res.status(200).json(artwork);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while getting artwork by ID');
    }
  }

  /**
   * Get artworks info to show in Unity by Artwork ID
   * @route GET /api/artworks/info/:id
   */
  async getArtworkInfoById(req: Request, res: Response): Promise<void> {
    try {
      const artworkInfo = await ArtworkService.getArtworkInfoById(req.params.id);
      res.status(200).json(artworkInfo);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while getting artwork info by ID');
    }
  }
  /**
   * Create new artwork
   * @route POST /api/artworks
   */
  async createArtwork(req: AuthRequest, res: Response): Promise<void> {
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
      
      const io = req.app.get('io');
      
      const savedArtwork = await ArtworkService.createArtwork(
        req.body.title,
        req.body.description,
        req.user,
        req.body.category,
        req.body.tags,
        req.body.creationDate,
        req.file,
        io
      );
      
      res.status(201).json(savedArtwork);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while creating artwork');
    }
  }

  /**
   * Update artwork
   * @route PUT /api/artworks/:id
   */
  async updateArtwork(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const updatedArtwork = await ArtworkService.updateArtwork(
        req.params.id,
        req.user,
        {
          title: req.body.title,
          description: req.body.description,
          category: req.body.category,
          tags: req.body.tags
        },
        req.file
      );
      
      res.status(200).json(updatedArtwork);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while updating artwork');
    }
  }

  /**
   * Delete artwork
   * @route DELETE /api/artworks/:id
   */
  async deleteArtwork(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const result = await ArtworkService.deleteArtwork(req.params.id, req.user);
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while deleting artwork');
    }
  }

  /**
   * Approve an artwork
   * @route PATCH /api/artworks/:id/approve
   */
  async approveArtwork(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return 
      }

      const io = req.app.get('io');
      const result = await ArtworkService.approveArtwork(req.params.id, req.user, io);
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while approving artwork');
    }
  }

  /**
   * Reject an artwork
   * @route PATCH /api/artworks/:id/reject
   */
  async rejectArtwork(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return 
      }

      const io = req.app.get('io');
      const result = await ArtworkService.rejectArtwork(req.params.id, req.user, io);
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while rejecting artwork');
    }
  }
}