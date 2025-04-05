import { Router } from 'express';
import { body } from 'express-validator';
import { 
  getAllArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork
} from '../controllers/artwork.controller';

import { authenticate, authorize } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { validate } from '../middlewares/validation.middleware';
import { UserRole } from '../entities/User';

const router = Router();

// Get all artworks
router.get('/', getAllArtworks);

// Get artwork by ID
router.get('/:id', getArtworkById);

// Create new artwork (artist only)
router.post(
  '/',
  authenticate,
  authorize([UserRole.ARTIST]),
  upload.single('image'),
  validate([
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title is required and must be under 100 characters'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('tags').optional().isString().withMessage('Tags must be a JSON string array')
  ]),
  createArtwork
);

// Update artwork (artist or admin only)
router.put(
  '/:id',
  authenticate,
  upload.single('image'),
  validate([
    body('title').optional().isLength({ min: 1, max: 100 }).withMessage('Title must be under 100 characters'),
    body('description').optional(),
    body('category').optional(),
    body('tags').optional().isString().withMessage('Tags must be a JSON string array')
  ]),
  updateArtwork
);

// Delete artwork (artist or admin only)
router.delete('/:id', authenticate, deleteArtwork);

export default router;