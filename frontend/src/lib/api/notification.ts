import api from './index';
import { Notification } from '@/contexts/NotificationContext';

/**
 * Get unread notifications for the current user
 */
export const getUnreadNotifications = async (): Promise<{ 
  notifications: Notification[]; 
  count: number 
}> => {
  const response = await api.get('/notifications/unread');
  return response.data;
};

/**
 * Get all notifications for the current user with pagination
 * @param limit Number of notifications to retrieve
 */
export const getAllNotifications = async (limit = 20): Promise<{ 
  notifications: Notification[] 
}> => {
  const response = await api.get('/notifications', { params: { limit } });
  return response.data;
};

/**
 * Mark a notification as read
 * @param id Notification ID
 */
export const markNotificationAsRead = async (id: string): Promise<{ 
  message: string 
}> => {
  const response = await api.patch(`/notifications/${id}`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<{ 
  message: string 
}> => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};