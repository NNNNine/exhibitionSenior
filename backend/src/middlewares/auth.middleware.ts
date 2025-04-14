import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { logger } from '../utils/logger';

// Extended request type with user property
export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Middleware to authenticate JWT token and attach user to request
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // First check for token in cookies (more secure)
    let token = req.cookies.token;
    
    // Fallback to Authorization header if token not in cookies
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Extract and verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { id: string; role: UserRole };

    // Find user in database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Verify user's role matches token role for additional security
    if (user.role !== decoded.role) {
      logger.warn(`Role mismatch for user ${user.id}: Token role ${decoded.role} != DB role ${user.role}`);
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT verification failed:', error.message);
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    
    logger.error('Authentication error:', error);
    next(error);
  }
};

/**
 * Middleware to check if user has required role
 * This enhanced version allows an array of roles and provides better error handling
 * @param roles Array of allowed roles
 */
export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Authorization failed: User ${req.user.id} with role ${req.user.role} attempted to access route restricted to ${roles.join(', ')}`);
      res.status(403).json({ 
        message: 'Access denied',
        error: `This action requires one of these roles: ${roles.join(', ')}`,
        requiredRoles: roles,
        currentRole: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Middleware factory that combines authentication and authorization
 * Useful for protecting API routes with role-based access control
 * @param roles Array of allowed roles
 */
export const withAuth = (roles: UserRole[] = []) => {
  return [
    authenticate,
    ...(roles.length > 0 ? [authorize(roles)] : [])
  ];
};