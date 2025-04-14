import { Router } from 'express';
import { body, param } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { withAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { UserRole } from '../entities/User';

const router = Router();
const userController = new UserController();

// Admin-only route
router.get('/', ...withAuth([UserRole.ADMIN]), 
  userController.getAllUsers
);

// Public route
router.get('/:id', userController.getUserById);
router.get('/username/:username', userController.getUserByUsername);

// Self or Admin route (controller will check if user can update this profile)
router.put('/:id', ...withAuth(),  // Any authenticated user can try (controller will verify rights)
  validate([
    param('id').isUUID().withMessage('Invalid user ID'),
    body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('email').optional().isEmail().withMessage('Must be a valid email address'),
    body('profileUrl').optional().isURL().withMessage('Profile URL must be a valid URL'),
    body('preferences').optional().isObject().withMessage('Preferences must be an object')
  ]),
  userController.updateUser
);

// Admin-only route
router.delete('/:id', ...withAuth([UserRole.ADMIN]),
  validate([
    param('id').isUUID().withMessage('Invalid user ID')
  ]),
  userController.deleteUser
);

// Public route
router.get('/artworks/:userId', userController.getUserArtworks);

export default router;