'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthContext } from './AuthContext';
import { message } from 'antd';
import { UserRole } from '@/types/user.types';
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api/notification';

// Define notification type
export interface Notification {
  id: string;
  type: string;
  message: string;
  entityId: string | null;
  recipientId: string;
  senderId: string | null;
  sender?: {
    id: string;
    username: string;
    profileUrl?: string;
  };
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getNotifications: () => Promise<void>;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Socket instance
let socket: Socket | null = null;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection
      socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          userId: user.id, // Add to auth object for access in disconnect handler
          userRole: user.role
        }
      });

      // Handle connection events
      socket.on('connect', () => {
        console.log('Socket.IO connected');
        
        // Authenticate socket with user ID and role
        if (socket) {
            // Authenticate socket with user ID and role
            socket.emit('authenticate', { 
                userId: user.id, 
                userRole: user.role 
            });
        }
      });

      socket.on('connect_error', (err: Error) => {
        console.error('Socket.IO connection error:', err);
      });

      // Listen for new artwork notifications (for curators)
      if (user.role === UserRole.CURATOR) {
        socket.on('new-artwork', (data: { id: string; title: string; artist: string; artistId: string }) => {
          console.log('New artwork notification:', data);
          
          // Show toast notification
          message.info({
            content: `${data.artist} uploaded a new artwork: "${data.title}"`,
            duration: 5,
            key: `artwork-${data.id}`,
            onClick: () => {
              window.location.href = `/artworks/${data.id}`;
            }
          });
          
          // Add to notifications state
          const newNotification: Notification = {
            id: `temp-${Date.now()}`, // Will be replaced on refresh
            type: 'artwork_upload',
            message: `${data.artist} uploaded a new artwork: "${data.title}"`,
            entityId: data.id,
            recipientId: user.id,
            senderId: data.artistId,
            sender: {
              id: data.artistId,
              username: data.artist
            },
            isRead: false,
            createdAt: new Date().toISOString()
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        });
      }

      // Listen for artwork approval notifications (for artists)
      if (user.role === UserRole.ARTIST) {
        socket.on('artwork-approved', (data: { id: string; title: string; curatorName: string }) => {
          console.log('Artwork approved notification:', data);
          
          // Show toast notification
          message.success({
            content: `Your artwork "${data.title}" was approved by ${data.curatorName}`,
            duration: 5,
            key: `approval-${data.id}`,
            onClick: () => {
              window.location.href = `/artworks/${data.id}`;
            }
          });
          
          // Add to notifications state
          const newNotification: Notification = {
            id: `temp-${Date.now()}`, // Will be replaced on refresh
            type: 'artwork_approved',
            message: `Your artwork "${data.title}" was approved by ${data.curatorName}`,
            entityId: data.id,
            recipientId: user.id,
            senderId: null,
            isRead: false,
            createdAt: new Date().toISOString()
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        });
      }
      
      // Listen for artwork rejection notifications (for artists)
      if (user.role === UserRole.ARTIST) {
        socket.on('artwork-rejected', (data: { id: string; title: string; reason?: string }) => {
          console.log('Artwork rejected notification:', data);
          
          // Show toast notification
          message.error({
            content: `Your artwork "${data.title}" was rejected${data.reason ? `: ${data.reason}` : ''}`,
            duration: 5,
            key: `rejection-${data.id}`,
            onClick: () => {
              window.location.href = `/artworks/${data.id}`;
            }
          });
          
          // Add to notifications state
          const newNotification: Notification = {
            id: `temp-${Date.now()}`, // Will be replaced on refresh
            type: 'artwork_rejected',
            message: `Your artwork "${data.title}" was rejected${data.reason ? `: ${data.reason}` : ''}`,
            entityId: data.id,
            recipientId: user.id,
            senderId: null,
            isRead: false,
            createdAt: new Date().toISOString()
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        });
      }
      
      // Clean up socket connection on unmount
      return () => {
        if (socket) {
          socket.disconnect();
          socket = null;
        }
      };
    }
  }, [isAuthenticated, user]);

  // Fetch unread notifications on mount
  useEffect(() => {
    if (isAuthenticated) {
      getNotifications();
      
      // Set up polling for regular updates
      const interval = setInterval(() => {
        getNotifications();
      }, 30000); // Poll every 30 seconds as fallback
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Get unread notifications
  const getNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const { notifications: fetchedNotifications, count } = await getUnreadNotifications();
      setNotifications(fetchedNotifications);
      setUnreadCount(count);
    } catch (error: unknown) {
      console.error('Error fetching notifications:', error instanceof Error ? error.message : error);
      // Don't update state if there's an error, keep showing existing notifications
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: unknown) {
      console.error('Error marking notification as read:', error instanceof Error ? error.message : error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error: unknown) {
      console.error('Error marking all notifications as read:', error instanceof Error ? error.message : error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      getNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};