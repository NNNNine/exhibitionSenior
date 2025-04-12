import { Router } from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  refreshToken, 
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// Register new user
router.post(
  '/register',
  validate([
    body('username').isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['visitor', 'artist']).withMessage('Role must be visitor or artist')
  ]),
  register
);

// Login user
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
  ]),
  login
);

// Refresh access token - no longer requires token in body since it's in HttpOnly cookie
router.post('/refresh-token', refreshToken);

// Logout user
router.post('/logout', logout);

// Get current user
router.get('/me', authenticate, getCurrentUser);

// Change password
router.post(
  '/change-password',
  authenticate,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ]),
  changePassword
);

// Request password reset
router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().withMessage('Must be a valid email address')
  ]),
  forgotPassword
);

// Reset password with token
router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ]),
  resetPassword
);

export default router;