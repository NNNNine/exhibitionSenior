import { Request, Response } from 'express';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';

// Helper function for setting secure cookies
const setAuthCookies = (res: Response, token: string, refreshToken: string) => {
  // Set token in HttpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 * 1000, // 1 hour
    path: '/'
  });
  
  // Set refresh token in HttpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 3600 * 1000, // 7 days
    path: '/'
  });
};

// Helper function for clearing auth cookies
const clearAuthCookies = (res: Response) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/'
  });
  
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/'
  });
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, role } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(User);

    // Check if user already exists
    const userExists = await userRepository.findOne({
      where: [{ username }, { email }]
    });

    if (userExists) {
      res.status(400).json({ 
        message: 'User already exists with this username or email' 
      });
      return;
    }

    // Create new user
    const user = new User();
    user.username = username;
    user.email = email;
    user.password = await hash(password, 10);
    
    // Only allow visitor or artist role when registering
    user.role = (role === UserRole.ARTIST) ? UserRole.ARTIST : UserRole.VISITOR;

    const savedUser = await userRepository.save(user);

    // Create tokens
    const token = jwt.sign(
      { id: savedUser.id, role: savedUser.role }, // Include role in token payload
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRY || '1h' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { id: savedUser.id, role: savedUser.role }, // Include role in refresh token
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' } as jwt.SignOptions
    );

    // Don't send password back
    const { password: _, ...userResponse } = savedUser;

    // Set secure cookies
    setAuthCookies(res, token, refreshToken);

    res.status(201).json({
      ...userResponse,
      token,
      refreshToken
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Login a user
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Create tokens with user role
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRY || '1h' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' } as jwt.SignOptions
    );

    // Don't send password back
    const { password: _, ...userResponse } = user;

    // Set secure cookies
    setAuthCookies(res, token, refreshToken);

    res.status(200).json({
      user: userResponse,
      token,
      refreshToken
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  // Get the refresh token from the cookie instead of the request body
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(400).json({ message: 'Refresh token is required' });
    return;
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as { id: string, role: UserRole };

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      clearAuthCookies(res);
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    // Create new tokens including role
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRY || '1h' } as jwt.SignOptions
    );

    const newRefreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' } as jwt.SignOptions
    );

    // Set secure cookies
    setAuthCookies(res, token, newRefreshToken);

    res.status(200).json({
      token,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    // Clear cookies on error
    clearAuthCookies(res);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  // Clear auth cookies
  clearAuthCookies(res);
  
  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Get current user
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // User should be attached to request by auth middleware
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Don't send password
    const { password, ...userWithoutPassword } = req.user;

    res.status(200).json(userWithoutPassword);
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Change password
 * @route POST /api/auth/change-password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Verify current password
    const isMatch = await compare(currentPassword, req.user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    // Update password
    const userRepository = AppDataSource.getRepository(User);
    req.user.password = await hash(newPassword, 10);
    await userRepository.save(req.user);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal that the user doesn't exist
      res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_RESET_SECRET as string,
      { expiresIn: '1h' }
    );

    // In a real application, you would send an email with the reset token
    // For now, just log it
    logger.info(`Reset token for ${email}: ${resetToken}`);

    res.status(200).json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_RESET_SECRET as string
    ) as { id: string };

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    // Update password
    user.password = await hash(newPassword, 10);
    await userRepository.save(user);

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(400).json({ message: 'Invalid or expired token' });
    }
    logger.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};