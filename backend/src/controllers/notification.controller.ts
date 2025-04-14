import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { 
  getUnreadNotificationsForUser, 
  getAllNotificationsForUser, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/notification.service';
import { handleErrorController } from '../utils/handleErrorController';
import { validateRequestBody } from '../utils/validateRequestBody';

export class NotificationController {
  /**
   * Get unread notifications for current user
   * @route GET /api/notifications/unread
   */
  async getUnreadNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const notifications = await getUnreadNotificationsForUser(req.user.id);
      
      res.status(200).json({ 
        data: { notifications, count: notifications.length }
      });
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error fetching unread notifications');
    }
  }

  /**
   * Get all notifications for current user
   * @route GET /api/notifications
   */
  async getAllNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      // Validate limit parameter
      await validateRequestBody({ limit });
      
      const notifications = await getAllNotificationsForUser(req.user.id, limit);
      
      res.status(200).json({ data: { notifications } });
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error fetching all notifications');
    }
  }

  /**
   * Mark a notification as read
   * @route PATCH /api/notifications/:id
   */
  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const notificationId = req.params.id;
      
      // Validate notification ID
      await validateRequestBody({ notificationId });
      
      await markNotificationAsRead(notificationId);
      
      res.status(200).json({ 
        data: { message: 'Notification marked as read' }
      });
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error marking notification as read');
    }
  }

  /**
   * Mark all notifications as read
   * @route PATCH /api/notifications/read-all
   */
  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      await markAllNotificationsAsRead(req.user.id);
      
      res.status(200).json({ 
        data: { message: 'All notifications marked as read' }
      });
    } catch (error: any) {
      handleErrorController(error, req, res, 'Error marking all notifications as read');
    }
  }
}