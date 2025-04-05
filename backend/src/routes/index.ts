import { Router } from 'express';
import authRoutes from './auth.routes';
import artworkRoutes from './artwork.routes';
import exhibitionRoutes from './exhibition.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/artworks', artworkRoutes);
router.use('/exhibitions', exhibitionRoutes);
router.use('/users', userRoutes);

export default router;