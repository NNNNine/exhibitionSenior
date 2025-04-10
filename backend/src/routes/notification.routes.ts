import { Router } from 'express';
import { 
  getUnreadNotifications, 
  getAllNotifications, 
  markAsRead, 
  markAllAsRead 
} from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get unread notifications
router.get('/unread', getUnreadNotifications);

// Get all notifications
router.get('/', getAllNotifications);

// Mark a notification as read
router.patch('/:id', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

export default router;