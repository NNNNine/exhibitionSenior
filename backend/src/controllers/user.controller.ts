// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { Artwork } from '../entities/Artwork';
import { logger } from '../utils/logger';

/**
 * Get all users (admin only)
 * @route GET /api/users
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // Extract query parameters for filtering and pagination
    const { 
      search,
      role,
      page = 1,
      limit = 10
    } = req.query;
    
    let query = userRepository.createQueryBuilder('user');
    
    // Apply filters if provided
    if (search) {
      query = query.where(
        '(user.username ILIKE :search OR user.email ILIKE :search)', 
        { search: `%${search}%` }
      );
    }
    
    if (role) {
      query = query.andWhere('user.role = :role', { role });
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    query = query
      .skip(skip)
      .take(Number(limit))
      .orderBy('user.createdAt', 'DESC');
    
    // Execute query with count
    const [users, total] = await query.getManyAndCount();
    
    // Remove password from response
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.status(200).json({
      users: usersWithoutPassword,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user by username
 * @route GET /api/users/username/:username
 */
export const getUserByUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { username: req.params.username }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    logger.error('Get user by username error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Check if the authenticated user is updating their own profile or is an admin
    if (req.user.id !== user.id && req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Not authorized to update this user' });
      return;
    }
    
    // Fields that can be updated
    const { username, email, profileUrl, preferences } = req.body;
    
    // Only update role if user is admin
    if (req.body.role && req.user.role === UserRole.ADMIN) {
      user.role = req.body.role;
    }
    
    // Update other fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (profileUrl) user.profileUrl = profileUrl;
    if (preferences) user.preferences = preferences;
    
    const updatedUser = await userRepository.save(user);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Only administrators can delete users' });
      return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    await userRepository.remove(user);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get artworks by user
 * @route GET /api/users/artworks/:userId
 */
export const getUserArtworks = async (req: Request, res: Response): Promise<void> => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    
    // Extract query parameters for pagination
    const { 
      page = 1,
      limit = 10
    } = req.query;
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get artworks by user ID
    const [artworks, total] = await artworkRepository.findAndCount({
      where: { artistId: req.params.userId },
      skip,
      take: Number(limit),
      order: { creationDate: 'DESC' },
      relations: ['artist']
    });
    
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
    logger.error('Get user artworks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};