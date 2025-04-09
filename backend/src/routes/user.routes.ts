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
import { withAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { UserRole } from '../entities/User';

const router = Router();

// Admin-only route
router.get('/', ...withAuth([UserRole.ADMIN]), 
  getAllUsers
);

// Public route
router.get('/:id', getUserById);
router.get('/username/:username', getUserByUsername);

// Self or Admin route (controller will check if user can update this profile)
router.put('/:id', ...withAuth(),  // Any authenticated user can try (controller will verify rights)
  validate([
    param('id').isUUID().withMessage('Invalid user ID'),
    body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('email').optional().isEmail().withMessage('Must be a valid email address'),
    body('profileUrl').optional().isURL().withMessage('Profile URL must be a valid URL'),
    body('preferences').optional().isObject().withMessage('Preferences must be an object')
  ]),
  updateUser
);

// Admin-only route
router.delete('/:id', ...withAuth([UserRole.ADMIN]),
  validate([
    param('id').isUUID().withMessage('Invalid user ID')
  ]),
  deleteUser
);

// Public route
router.get('/artworks/:userId', getUserArtworks);

export default router;