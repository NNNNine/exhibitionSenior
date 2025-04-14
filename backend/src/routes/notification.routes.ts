import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

// All notification routes require authentication
router.use(authenticate);

// Get unread notifications
router.get('/unread', notificationController.getUnreadNotifications);

// Get all notifications
router.get('/', notificationController.getAllNotifications);

// Mark a notification as read
router.patch('/:id', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

export default router;