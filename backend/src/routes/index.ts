import { Router } from 'express';
import authRoutes from './auth.routes';
import artworkRoutes from './artwork.routes';
import exhibitionRoutes from './exhibition.routes';
import userRoutes from './user.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/artworks', artworkRoutes);
router.use('/exhibition', exhibitionRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);

export default router;