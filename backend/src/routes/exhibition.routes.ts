// backend/src/routes/exhibition.routes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { ExhibitionController } from '../controllers/exhibition.controller';
import { withAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { UserRole } from '../entities/User';
import { PlacementPosition } from '../entities/ArtworkPlacement';

const router = Router();
const exhibitionController = new ExhibitionController();

// Public routes
router.get('/', exhibitionController.getExhibition);
router.get('/walls', exhibitionController.getWalls);

// Protected routes - Curator or Admin only
router.post('/', ...withAuth([UserRole.CURATOR]),
  validate([
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title is required and must be under 100 characters'),
    body('description').notEmpty().withMessage('Description is required'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').isISO8601().withMessage('End date must be a valid date'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ]),
  exhibitionController.createOrUpdateExhibition
);

// Wall management routes - Curator or Admin only
router.post('/walls', ...withAuth([UserRole.CURATOR]),
  validate([
    body('name').isLength({ min: 1, max: 100 }).withMessage('Wall name is required and must be under 100 characters')
  ]),
  exhibitionController.createWall
);

router.put('/walls/:id', ...withAuth([UserRole.CURATOR]),
  validate([
    param('id').isUUID().withMessage('Invalid wall ID'),
    body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Wall name must be under 100 characters'),
    body('displayOrder').optional().isInt().withMessage('Display order must be an integer')
  ]),
  exhibitionController.updateWall
);

router.delete('/walls/:id', ...withAuth([UserRole.CURATOR]),
  validate([
    param('id').isUUID().withMessage('Invalid wall ID')
  ]),
  exhibitionController.deleteWall
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
  exhibitionController.updateWallLayout
);

// Stockpile route - Get all approved artworks for placement
router.get('/stockpile', ...withAuth([UserRole.CURATOR]), 
exhibitionController.getArtworksForPlacement
);

router.get('/:exhibitionId/walls', exhibitionController.getWallsWithImages);

export default router;