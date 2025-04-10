import { io, Socket } from 'socket.io-client';
import { UserRole } from '@/types/user.types';

let socket: Socket | null = null;

/**
 * Get the socket.io client instance
 * Creates a new connection if none exists
 */
export const getSocketClient = (): Socket => {
  if (!socket) {
    // Create socket connection with config for reliability
    socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    // Add event handlers for connection management
    socket.on('connect', () => {
      console.log('Socket.IO connected with ID:', socket?.id);
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });
    
    // Add ping/pong for keeping connection alive
    setInterval(() => {
      if (socket?.connected) {
        socket.emit('ping');
      }
    }, 25000);
    
    socket.on('pong', () => {
      console.debug('Received pong from server');
    });
  }
  
  return socket;
};

/**
 * Authenticate the socket connection with user information
 * @param userId User ID for authentication
 * @param userRole User role for role-based notifications
 */
export const authenticateSocket = (userId: string, userRole: UserRole): void => {
  const socket = getSocketClient();
  
  socket.emit('authenticate', { userId, userRole });
  
  console.log('Socket authenticated for user:', userId);
};

/**
 * Join a specific room for targeted notifications
 * @param roomId Room ID to join (e.g., exhibition ID)
 */
export const joinRoom = (roomId: string): void => {
  const socket = getSocketClient();
  
  socket.emit('join-room', roomId);
};

/**
 * Leave a specific room
 * @param roomId Room ID to leave
 */
export const leaveRoom = (roomId: string): void => {
  const socket = getSocketClient();
  
  socket.emit('leave-room', roomId);
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};