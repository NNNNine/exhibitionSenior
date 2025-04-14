// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as AuthService from '../services/auth.service';
import { handleErrorController } from '../utils/handleErrorController';
import { validateRequestBody } from '../utils/validateRequestBody';

export class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, role } = req.body;
      
      // Validate required fields
      await validateRequestBody({ username, email, password });
      
      const result = await AuthService.register(username, email, password, role);
      
      // Set secure cookies
      AuthService.setAuthCookies(res, result.token, result.refreshToken);

      res.status(201).json({
        ...result.user,
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error: any) {
      res.status(400).json(handleErrorController(error, req, res, 'Error while registering user'));
    }
  }

  /**
   * Login a user
   * @route POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      // Validate required fields
      await validateRequestBody({ email, password });
      
      const result = await AuthService.login(email, password);
      
      // Set secure cookies
      AuthService.setAuthCookies(res, result.token, result.refreshToken);

      res.status(200).json({
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error: any) {
      res.status(400).json(handleErrorController(error, req, res, 'Error while logging in'));
    }
  }

  /**
   * Refresh access token
   * @route POST /api/auth/refresh-token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get the refresh token from the cookie instead of the request body
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(400).json({ message: 'Refresh token is required' });
      }

      const result = await AuthService.refreshAccessToken(refreshToken);
      
      // Set secure cookies
      AuthService.setAuthCookies(res, result.token, result.refreshToken);

      res.status(200).json({
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error: any) {
      // Clear cookies on error
      AuthService.clearAuthCookies(res);
      res.status(400).json(handleErrorController(error, req, res, 'Error while refreshing token'));
    }
  }

  /**
   * Logout user
   * @route POST /api/auth/logout
   */
  logout = async (_req: Request, res: Response): Promise<void> => {
    try {
      // Clear auth cookies
      AuthService.clearAuthCookies(res);
      
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(400).json(handleErrorController(error, _req, res, 'Error while logging out'));
    }
  }

  /**
   * Get current user
   * @route GET /api/auth/me
   */
  getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // User should be attached to request by auth middleware
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
      }

      // Don't send password
      const { ...userWithoutPassword } = req.user;

      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json(handleErrorController(error, req, res, 'Error while getting current user'));
    }
  }

  /**
   * Change password
   * @route POST /api/auth/change-password
   */
  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validate required fields
      await validateRequestBody({ currentPassword, newPassword });

      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return
      }

      const result = await AuthService.changePassword(req.user.username, currentPassword, newPassword);
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while changing password');
    }
  }

  /**
   * Request password reset
   * @route POST /api/auth/forgot-password
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      // Validate required fields
      await validateRequestBody({ email });

      const result = await AuthService.forgotPassword(email);
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while processing password reset request');
    }
  }

  /**
   * Reset password with token
   * @route POST /api/auth/reset-password
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      
      // Validate required fields
      await validateRequestBody({ token, newPassword });

      const result = await AuthService.resetPassword(token, newPassword);
      res.status(200).json(result);
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error while resetting password');
    }
  }
}