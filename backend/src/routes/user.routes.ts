import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  getAllUsers,
  getUserById,
  getUserByUsername,
  updateUser,
  deleteUser,
  getUserArtworks
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { UserRole } from '../entities/User';

const router = Router();

// Get all users (admin only)
router.get(
  '/', 
  authenticate, 
  authorize([UserRole.ADMIN]), 
  getAllUsers
);

// Get user by ID
router.get('/:id', getUserById);

// Get user by username
router.get('/username/:username', getUserByUsername);

// Update user
router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Invalid user ID'),
    body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('email').optional().isEmail().withMessage('Must be a valid email address'),
    body('profileUrl').optional().isURL().withMessage('Profile URL must be a valid URL'),
    body('preferences').optional().isObject().withMessage('Preferences must be an object')
  ]),
  updateUser
);

// Delete user (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN]),
  validate([
    param('id').isUUID().withMessage('Invalid user ID')
  ]),
  deleteUser
);

// Get user artworks
router.get('/artworks/:userId', getUserArtworks);

export default router;