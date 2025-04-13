// backend/src/routes/exhibition.routes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  getExhibition,
  createOrUpdateExhibition,
  getWalls,
  createWall,
  updateWall,
  deleteWall,
  updateWallLayout,
  getArtworksForPlacement,
  getWallsWithImages
} from '../controllers/exhibition.controller';
import { withAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { UserRole } from '../entities/User';
import { PlacementPosition } from '../entities/ArtworkPlacement';

const router = Router();

// Public routes
router.get('/', getExhibition);
router.get('/walls', getWalls);

// Protected routes - Curator or Admin only
router.post('/', ...withAuth([UserRole.CURATOR]),
  validate([
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title is required and must be under 100 characters'),
    body('description').notEmpty().withMessage('Description is required'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').isISO8601().withMessage('End date must be a valid date'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ]),
  createOrUpdateExhibition
);

// Wall management routes - Curator or Admin only
router.post('/walls', ...withAuth([UserRole.CURATOR]),
  validate([
    body('name').isLength({ min: 1, max: 100 }).withMessage('Wall name is required and must be under 100 characters')
  ]),
  createWall
);

router.put('/walls/:id', ...withAuth([UserRole.CURATOR]),
  validate([
    param('id').isUUID().withMessage('Invalid wall ID'),
    body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Wall name must be under 100 characters'),
    body('displayOrder').optional().isInt().withMessage('Display order must be an integer')
  ]),
  updateWall
);

router.delete('/walls/:id', ...withAuth([UserRole.CURATOR]),
  validate([
    param('id').isUUID().withMessage('Invalid wall ID')
  ]),
  deleteWall
);

// Wall layout routes
router.post('/walls/:id/layout', ...withAuth([UserRole.CURATOR]),
  validate([
    param('id').isUUID().withMessage('Invalid wall ID'),
    body('placements').isArray().withMessage('Placements must be an array'),
    body('placements.*.artworkId').isUUID().withMessage('Invalid artwork ID'),
    body('placements.*.position').optional().isIn(Object.values(PlacementPosition)).withMessage('Invalid position'),
    body('placements.*.coordinates').optional().isObject().withMessage('Coordinates must be an object'),
    body('placements.*.rotation').optional().isObject().withMessage('Rotation must be an object'),
    body('placements.*.scale').optional().isObject().withMessage('Scale must be an object')
  ]),
  updateWallLayout
);

// Stockpile route - Get all approved artworks for placement
router.get('/stockpile', ...withAuth([UserRole.CURATOR]), 
  getArtworksForPlacement
);

router.get('/:exhibitionId/walls', getWallsWithImages);

export default router;