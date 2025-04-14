import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { handleErrorController } from '../utils/handleErrorController';
import { validateRequestBody } from '../utils/validateRequestBody';
import * as ExhibitionService from '../services/exhibition.service';

export class ExhibitionController {
  /**
   * Get the active exhibition with all walls and artwork placements
   * @route GET /api/exhibition
   */
  async getExhibition(_req: Request, res: Response): Promise<void> {
    try {
      const exhibition = await ExhibitionService.getExhibition();
      res.status(200).json(exhibition);
    } catch (error: any) {
      handleErrorController(error, _req, res, 'Error while getting exhibition');
    }
  }

  /**
   * Create or update the exhibition
   * @route POST /api/exhibition
   */
  async createOrUpdateExhibition(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Authenticate
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }
      
      const { title, description, startDate, endDate, isActive } = req.body;
      
      // Validate required fields
      await validateRequestBody({ title, description, startDate, endDate });
      
      const savedExhibition = await ExhibitionService.createOrUpdateExhibition(
        req.user,
        title,
        description,
        startDate,
        endDate,
        isActive
      );
      
      res.status(200).json(savedExhibition);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while creating/updating exhibition');
    }
  }

  /**
   * Get all walls for the exhibition
   * @route GET /api/exhibition/walls
   */
  async getWalls(_req: Request, res: Response): Promise<void> {
    try {
      const walls = await ExhibitionService.getWalls();
      res.status(200).json(walls);
    } catch (error: any) {
      handleErrorController(error, _req, res, 'Error while getting walls');
    }
  }

  /**
   * Create a new wall in the exhibition
   * @route POST /api/exhibition/walls
   */
  async createWall(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }
      
      const { name } = req.body;
      
      // Validate required fields
      await validateRequestBody({ name });
      
      const savedWall = await ExhibitionService.createWall(req.user, name);
      res.status(201).json(savedWall);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while creating wall');
    }
  }

  /**
   * Update a wall
   * @route PUT /api/exhibition/walls/:id
   */
  async updateWall(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }
      
      const { name, displayOrder } = req.body;
      const wallId = req.params.id;
      
      // Validate required fields
      await validateRequestBody({ wallId, name });
      
      const savedWall = await ExhibitionService.updateWall(
        req.user, 
        wallId, 
        { name, displayOrder }
      );
      
      res.status(200).json(savedWall);
    } catch (error: any) {
       handleErrorController(error, req, res, 'Error while updating wall');
    }
  }

  /**
   * Delete a wall
   * @route DELETE /api/exhibition/walls/:id
   */
  async deleteWall(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }
      
      const result = await ExhibitionService.deleteWall(req.user, req.params.id);
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while deleting wall');
    }
  }

  /**
   * Update the layout of artworks on a wall
   * @route POST /api/exhibition/walls/:id/layout
   */
  async updateWallLayout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }
      
      const { placements } = req.body;
      const wallId = req.params.id;
      
      // Validate required fields
      await validateRequestBody({ wallId, placements });
      
      const updatedWall = await ExhibitionService.updateWallLayout(
        req.user,
        wallId,
        placements
      );
      
      res.status(200).json(updatedWall);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while updating wall layout');
    }
  }

  /**
   * Get all approved artworks for placement (curator's stockpile)
   * @route GET /api/exhibition/stockpile
   */
  async getArtworksForPlacement(_req: Request, res: Response): Promise<void> {
    try {
      const artworks = await ExhibitionService.getArtworksForPlacement();
      res.status(200).json(artworks);
    } catch (error: any) {
      handleErrorController(error, _req, res, 'Error while getting artworks for placement');
    }
  }

  /**
   * Get walls with their images for a specific exhibition
   * @route GET /api/exhibition/:exhibitionId/walls
   */
  async getWallsWithImages(req: Request, res: Response): Promise<void> {
    try {
      const exhibitionId = req.params.exhibitionId;
      
      // Validate required fields
      await validateRequestBody({ exhibitionId });
      
      const wallResults = await ExhibitionService.getWallsWithImages(exhibitionId);
      res.json(wallResults);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while getting walls with images');
    }
  }
}