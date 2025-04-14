import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Helper function for setting secure cookies
 */
export const setAuthCookies = (res: Response, token: string, refreshToken: string) => {
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

/**
 * Helper function for clearing auth cookies
 */
export const clearAuthCookies = (res: Response) => {
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
 */
export const register = async (
  username: string,
  email: string,
  password: string,
  role?: string
) => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    // Check if user already exists
    const userExists = await userRepository.findOne({
      where: [{ username }, { email }]
    });

    if (userExists) {
      throw new Error('User already exists with this username or email');
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

    return {
      user: userResponse,
      token,
      refreshToken
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login a user
 */
export const login = async (email: string, password: string) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      throw new Error('Invalid credentials');
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

    return {
      user: userResponse,
      token,
      refreshToken
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as { id: string, role: UserRole };

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      throw new Error('Invalid refresh token');
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

    return {
      token,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    logger.error('Refresh token error:', error);
    throw error;
  }
};

/**
 * Change password
 */
export const changePassword = async (
  username: string,
  currentPassword: string,
  newPassword: string
) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const selectedUser = await userRepository.findOne({ where: { username: username } });

    if (!selectedUser) {
      throw new Error('User not found');
    }
    // Verify current password
    const isMatch = await compare(currentPassword, selectedUser.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    selectedUser.password = await hash(newPassword, 10);
    await userRepository.save(selectedUser);

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    logger.error('Change password error:', error);
    throw error;
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (email: string) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal that the user doesn't exist, but don't send an email either
      return { 
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.' 
      };
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

    return { 
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.' 
    };
  } catch (error) {
    logger.error('Forgot password error:', error);
    throw error;
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_RESET_SECRET as string
    ) as { id: string };

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      throw new Error('Invalid or expired token');
    }

    // Update password
    user.password = await hash(newPassword, 10);
    await userRepository.save(user);

    return { success: true, message: 'Password has been reset successfully' };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid or expired token');
    }
    logger.error('Reset password error:', error);
    throw error;
  }
};