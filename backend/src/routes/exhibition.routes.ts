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
import { withAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { UserRole } from '../entities/User';

const router = Router();

// Public routes
router.get('/', getAllExhibitions);
router.get('/:id', getExhibitionById);

// Protected routes - Curator or Admin only
router.post( '/', ...withAuth([UserRole.CURATOR, UserRole.ADMIN]),
  validate([
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title is required and must be under 100 characters'),
    body('description').notEmpty().withMessage('Description is required'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').isISO8601().withMessage('End date must be a valid date')
  ]),
  createExhibition
);

// Protected routes - Curator or Admin only
router.put( '/:id', ...withAuth([UserRole.CURATOR, UserRole.ADMIN]),
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

// Protected routes - Curator or Admin only
router.delete('/:id', ...withAuth([UserRole.CURATOR, UserRole.ADMIN]), deleteExhibition);

// Protected routes - Curator or Admin only
router.post( '/:id/items', ...withAuth([UserRole.CURATOR, UserRole.ADMIN]),
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
router.put( '/:id/items/:itemId', ...withAuth([UserRole.CURATOR, UserRole.ADMIN]),
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
router.delete('/:id/items/:itemId', ...withAuth([UserRole.CURATOR, UserRole.ADMIN]), 
  removeArtworkFromExhibition
);

export default router;