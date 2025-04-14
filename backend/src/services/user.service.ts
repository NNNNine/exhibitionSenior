import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { Artwork } from '../entities/Artwork';
import { logger } from '../utils/logger';

/**
 * Get all users with filtering and pagination
 */
export const getAllUsers = async (
  search?: string,
  role?: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
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
    
    return {
      users: usersWithoutPassword,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };
  } catch (error) {
    logger.error('Get all users error:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  } catch (error) {
    logger.error('Get user by ID error:', error);
    throw error;
  }
};

/**
 * Get user by username
 */
export const getUserByUsername = async (username: string) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { username }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  } catch (error) {
    logger.error('Get user by username error:', error);
    throw error;
  }
};

/**
 * Update user
 */
export const updateUser = async (
  currentUser: User,
  userId: string,
  updates: {
    username?: string;
    email?: string;
    profileUrl?: string;
    preferences?: any;
    role?: UserRole;
  }
) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if the authenticated user is updating their own profile or is an admin
    if (currentUser.id !== user.id && currentUser.role !== UserRole.ADMIN) {
      throw new Error('Not authorized to update this user');
    }
    
    // Only update role if user is admin
    if (updates.role && currentUser.role === UserRole.ADMIN) {
      user.role = updates.role;
    }
    
    // Update other fields if provided
    if (updates.username) user.username = updates.username;
    if (updates.email) user.email = updates.email;
    if (updates.profileUrl) user.profileUrl = updates.profileUrl;
    if (updates.preferences) user.preferences = updates.preferences;
    
    const updatedUser = await userRepository.save(user);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    return userWithoutPassword;
  } catch (error) {
    logger.error('Update user error:', error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (currentUser: User, userId: string) => {
  try {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new Error('Only administrators can delete users');
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    await userRepository.remove(user);
    
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    logger.error('Delete user error:', error);
    throw error;
  }
};

/**
 * Get artworks by user
 */
export const getUserArtworks = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const artworkRepository = AppDataSource.getRepository(Artwork);
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get artworks by user ID
    const [artworks, total] = await artworkRepository.findAndCount({
      where: { artistId: userId },
      skip,
      take: Number(limit),
      order: { creationDate: 'DESC' },
      relations: ['artist']
    });
    
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
    logger.error('Get user artworks error:', error);
    throw error;
  }
};