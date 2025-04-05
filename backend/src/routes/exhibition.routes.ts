import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  getAllExhibitions,
  getExhibitionById,
  createExhibition,
  updateExhibition,
  deleteExhibition,
  addArtworkToExhibition,
  updateExhibitionItem,
  removeArtworkFromExhibition
} from '../controllers/exhibition.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { UserRole } from '../entities/User';

const router = Router();

// Get all exhibitions
router.get('/', getAllExhibitions);

// Get exhibition by ID
router.get('/:id', getExhibitionById);

// Create new exhibition (curator only)
router.post(
  '/',
  authenticate,
  authorize([UserRole.CURATOR, UserRole.ADMIN]),
  validate([
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title is required and must be under 100 characters'),
    body('description').notEmpty().withMessage('Description is required'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').isISO8601().withMessage('End date must be a valid date')
  ]),
  createExhibition
);

// Update exhibition (curator or admin only)
router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Invalid exhibition ID'),
    body('title').optional().isLength({ min: 1, max: 100 }).withMessage('Title must be under 100 characters'),
    body('description').optional(),
    body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ]),
  updateExhibition
);

// Delete exhibition (curator or admin only)
router.delete('/:id', authenticate, deleteExhibition);

// Add artwork to exhibition
router.post(
  '/:id/items',
  authenticate,
  authorize([UserRole.CURATOR, UserRole.ADMIN]),
  validate([
    param('id').isUUID().withMessage('Invalid exhibition ID'),
    body('artworkId').isUUID().withMessage('Invalid artwork ID'),
    body('position').isObject().withMessage('Position must be an object with x, y, z coordinates'),
    body('rotation').isObject().withMessage('Rotation must be an object with x, y, z coordinates'),
    body('scale').isObject().withMessage('Scale must be an object with x, y, z coordinates')
  ]),
  addArtworkToExhibition
);

// Update exhibition item
router.put(
  '/:id/items/:itemId',
  authenticate,
  authorize([UserRole.CURATOR, UserRole.ADMIN]),
  validate([
    param('id').isUUID().withMessage('Invalid exhibition ID'),
    param('itemId').isUUID().withMessage('Invalid item ID'),
    body('position').optional().isObject().withMessage('Position must be an object with x, y, z coordinates'),
    body('rotation').optional().isObject().withMessage('Rotation must be an object with x, y, z coordinates'),
    body('scale').optional().isObject().withMessage('Scale must be an object with x, y, z coordinates')
  ]),
  updateExhibitionItem
);

// Remove artwork from exhibition
router.delete('/:id/items/:itemId', authenticate, removeArtworkFromExhibition);

export default router;