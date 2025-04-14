// backend/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { handleErrorController } from '../utils/handleErrorController';
import { validateRequestBody } from '../utils/validateRequestBody';
import * as UserService from '../services/user.service';

export class UserController {
  /**
   * Get all users (admin only)
   * @route GET /api/users
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { 
        search,
        role,
        page = 1,
        limit = 10
      } = req.query;
      
      // Validate pagination parameters
      await validateRequestBody({ page: Number(page), limit: Number(limit) });
      
      const result = await UserService.getAllUsers(
        search as string | undefined,
        role as string | undefined,
        Number(page),
        Number(limit)
      );
      
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while getting users');
    }
  }

  /**
   * Get user by ID
   * @route GET /api/users/:id
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      
      // Validate ID parameter
      await validateRequestBody({ userId });
      
      const user = await UserService.getUserById(userId);
      res.status(200).json(user);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while getting user by ID');
    }
  }

  /**
   * Get user by username
   * @route GET /api/users/username/:username
   */
  async getUserByUsername(req: Request, res: Response): Promise<void> {
    try {
      const username = req.params.username;
      
      // Validate username parameter
      await validateRequestBody({ username });
      
      const user = await UserService.getUserByUsername(username);
      res.status(200).json(user);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while getting user by username');
    }
  }

  /**
   * Update user
   * @route PUT /api/users/:id
   */
  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const userId = req.params.id;
      
      // Validate ID parameter
      await validateRequestBody({ userId });
      
      const updatedUser = await UserService.updateUser(
        req.user,
        userId,
        {
          username: req.body.username,
          email: req.body.email,
          profileUrl: req.body.profileUrl,
          preferences: req.body.preferences,
          role: req.body.role
        }
      );
      
      res.status(200).json(updatedUser);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while updating user');
    }
  }

  /**
   * Delete user
   * @route DELETE /api/users/:id
   */
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const userId = req.params.id;
      
      // Validate ID parameter
      await validateRequestBody({ userId });
      
      const result = await UserService.deleteUser(req.user, userId);
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while deleting user');
    }
  }

  /**
   * Get artworks by user
   * @route GET /api/users/artworks/:userId
   */
  async getUserArtworks(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1,
        limit = 10
      } = req.query;
      
      const userId = req.params.userId;
      
      // Validate parameters
      await validateRequestBody({ 
        userId,
        page: Number(page), 
        limit: Number(limit)
      });
      
      const result = await UserService.getUserArtworks(
        userId,
        Number(page),
        Number(limit)
      );
      
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while getting user artworks');
    }
  }
}