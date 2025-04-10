import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { 
  getUnreadNotificationsForUser, 
  getAllNotificationsForUser, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/notification.service';
import { logger } from '../utils/logger';

/**
 * Get unread notifications for current user
 * @route GET /api/notifications/unread
 */
export const getUnreadNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const notifications = await getUnreadNotificationsForUser(req.user.id);
    
    res.status(200).json({ notifications, count: notifications.length });
  } catch (error) {
    logger.error('Error fetching unread notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all notifications for current user
 * @route GET /api/notifications
 */
export const getAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const notifications = await getAllNotificationsForUser(req.user.id, limit);
    
    res.status(200).json({ notifications });
  } catch (error) {
    logger.error('Error fetching all notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark a notification as read
 * @route PATCH /api/notifications/:id
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    await markNotificationAsRead(req.params.id);
    
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    await markAllNotificationsAsRead(req.user.id);
    
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};