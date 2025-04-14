'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getNotifications: () => Promise<void>;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  getNotifications: async () => {}
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to track the socket instance to prevent multiple connections
  const socketRef = useRef<Socket | null>(null);
  
  // Use ref to track if context has been initialized to avoid duplicate API calls
  const initializedRef = useRef(false);

  // Initialize socket connection and setup event listeners
  useEffect(() => {
    // Only setup socket if authenticated and user exists
    if (!isAuthenticated || !user) {
      return;
    }
    
    // Prevent multiple socket connections
    if (socketRef.current) {
      return;
    }
    
    console.log('Creating socket connection for notifications');
    
    // Create socket connection
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        userId: user.id,
        userRole: user.role
      }
    });
    
    // Store socket reference
    socketRef.current = socket;

    // Handle connection events
    socket.on('connect', () => {
      console.log('Socket.IO connected for notifications');
      
      // Authenticate socket with user ID and role
      socket.emit('authenticate', { 
        userId: user.id, 
        userRole: user.role 
      });
    });

    socket.on('connect_error', (err: Error) => {
      console.error('Socket.IO connection error:', err);
      setError('Failed to connect to notification service');
    });

    // Setup handlers based on user role
    setupNotificationHandlers(socket, user.role);
    
    // Clean up socket connection on unmount
    return () => {
      console.log('Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  // Setup notification handlers based on user role
  const setupNotificationHandlers = (socket: Socket, role: UserRole) => {
    // Listen for new artwork notifications (for curators)
    if (role === UserRole.CURATOR) {
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
        
        // Create notification object
        const newNotification: Notification = {
          id: `temp-${Date.now()}`, // Will be replaced on refresh
          type: 'artwork_upload',
          message: `${data.artist} uploaded a new artwork: "${data.title}"`,
          entityId: data.id,
          recipientId: user?.id || '',
          senderId: data.artistId,
          sender: {
            id: data.artistId,
            username: data.artist
          },
          isRead: false,
          createdAt: new Date().toISOString()
        };
        
        // Update state with new notification
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    }

    // Listen for artwork approval notifications (for artists)
    if (role === UserRole.ARTIST) {
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
        
        // Create notification object
        const newNotification: Notification = {
          id: `temp-${Date.now()}`, // Will be replaced on refresh
          type: 'artwork_approved',
          message: `Your artwork "${data.title}" was approved by ${data.curatorName}`,
          entityId: data.id,
          recipientId: user?.id || '',
          senderId: null,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        
        // Update state with new notification
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
      
      // Listen for artwork rejection notifications
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
        
        // Create notification object
        const newNotification: Notification = {
          id: `temp-${Date.now()}`, // Will be replaced on refresh
          type: 'artwork_rejected',
          message: `Your artwork "${data.title}" was rejected${data.reason ? `: ${data.reason}` : ''}`,
          entityId: data.id,
          recipientId: user?.id || '',
          senderId: null,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        
        // Update state with new notification
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    }
  };

  // Fetch unread notifications on mount
  useEffect(() => {
    if (!isAuthenticated || initializedRef.current) {
      return;
    }
    
    // Set initialized to true to prevent duplicate calls
    initializedRef.current = true;
    
    // Load notifications
    getNotifications();
    
    // Set up polling for regular updates
    const interval = setInterval(() => {
      getNotifications();
    }, 60000); // Poll every minute as fallback
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Get unread notifications
  const getNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { notifications: fetchedNotifications, count } = await getUnreadNotifications();
      
      setNotifications(fetchedNotifications);
      setUnreadCount(count);
    } catch (error: unknown) {
      console.error('Error fetching notifications:', error instanceof Error ? error.message : error);
      setError('Failed to load notifications');
      // Keep existing notifications in case of error
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    if (!id) return;
    
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
      setError('Failed to mark notification as read');
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
      setError('Failed to mark all notifications as read');
    }
  };

  // Context value
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    getNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use the notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  return context;
};