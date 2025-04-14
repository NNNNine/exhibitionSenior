import { Router } from 'express';
import { body } from 'express-validator';
import { ArtworkController } from '../controllers/artwork.controller';
import { withAuth } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { validate } from '../middlewares/validation.middleware';
import { UserRole } from '../entities/User';

const router = Router();
const artworkController = new ArtworkController();

// Public routes
router.get('/', artworkController.getAllArtworks);
router.get('/:id', artworkController.getArtworkById);

router.get('/info/:id', artworkController.getArtworkInfoById);

// Protected routes - Artist only
router.post('/', ...withAuth([UserRole.ARTIST]), upload.single('image'),
  validate([
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title is required and must be under 100 characters'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('tags').optional().isString().withMessage('Tags must be a JSON string array')
  ]),
  artworkController.createArtwork
);

// Protected routes - Artist or Admin only
router.put('/:id', ...withAuth([UserRole.ARTIST, UserRole.ADMIN]), upload.single('image'),
  validate([
    body('title').optional().isLength({ min: 1, max: 100 }).withMessage('Title must be under 100 characters'),
    body('description').optional(),
    body('category').optional(),
    body('tags').optional().isString().withMessage('Tags must be a JSON string array')
  ]),
  artworkController.updateArtwork
);

// Protected routes - Artist or Admin only
router.delete('/:id', ...withAuth([UserRole.ARTIST, UserRole.ADMIN]), 
  artworkController.deleteArtwork
);

// Protected routes - Curator or Admin only
router.patch('/:id/approve', ...withAuth([UserRole.CURATOR, UserRole.ADMIN]),
  artworkController.approveArtwork
);
router.patch('/:id/reject', ...withAuth([UserRole.CURATOR, UserRole.ADMIN]),
  artworkController.rejectArtwork
);

export default router;