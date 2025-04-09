import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';

// Extended request type with user property
export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Middleware to authenticate JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Extract and verify token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { id: string };

    // Find user in database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
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