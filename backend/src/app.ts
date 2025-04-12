import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import http from 'http';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';

import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { csrfMiddleware } from './middlewares/csrf.middleware';
import { logger } from './utils/logger';
import { UserRole } from './entities/User';

// Initialize express app
const app = express();
const server: http.Server = http.createServer(app);

// Initialize socket.io with more configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  // Added for reliability with various network conditions
  path: '/socket.io/',
  pingInterval: 10000,
  pingTimeout: 5000,
  connectTimeout: 45000
});

// Set up global socket.io instance for use in services
app.set('io', io);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

// Add cookie parser middleware
app.use(cookieParser());

// Apply middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true // Important for cookies with CORS
}));

// Add Helmet for security headers
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Apply CSRF protection middleware
app.use(csrfMiddleware);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Maintain active user connections
const userConnections = new Map();

// Socket.io connection handling with enhanced features
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  // Authenticate user and join user-specific room
  socket.on('authenticate', (userData) => {
    if (userData && userData.userId) {
      // Store user connection consistently
      socket.data.userId = userData.userId;
      socket.data.userRole = userData.userRole;
      socket.handshake.auth.userId = userData.userId;
      
      // Add this socket to user's room (for targeted messages)
      socket.join(userData.userId);
      
      // Join role-based rooms
      if (userData.userRole) {
        socket.join(`role:${userData.userRole}`);
      }
      
      // Track active user connections
      if (!userConnections.has(userData.userId)) {
        userConnections.set(userData.userId, new Set());
      }
      userConnections.get(userData.userId).add(socket.id);
      
      logger.info(`User authenticated on socket: ${userData.userId}, role: ${userData.userRole}`);
      
      // Emit welcome message
      socket.emit('authenticated', { 
        status: 'success', 
        message: 'Authentication successful' 
      });
    }
  });
  
  // Handle joining exhibition room (for exhibition-specific updates)
  socket.on('join-exhibition', (exhibitionId) => {
    if (exhibitionId) {
      socket.join(`exhibition:${exhibitionId}`);
      logger.info(`Socket ${socket.id} joined exhibition room: ${exhibitionId}`);
    }
  });
  
  // Handle leaving exhibition room
  socket.on('leave-exhibition', (exhibitionId) => {
    if (exhibitionId) {
      socket.leave(`exhibition:${exhibitionId}`);
      logger.info(`Socket ${socket.id} left exhibition room: ${exhibitionId}`);
    }
  });
  
  // Handle client pings to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
    
    // Get userId from either location
    const userId = socket.data?.userId || socket.handshake.auth?.userId;
    
    // Clean up user connections tracking
    if (userId && userConnections.has(userId)) {
      userConnections.get(userId).delete(socket.id);
      
      // If this was the last connection for this user, remove the user entry
      if (userConnections.get(userId).size === 0) {
        userConnections.delete(userId);
      }
    }
  });
});

// Utility function to check if a user is online
app.set('isUserOnline', (userId: string) => {
  return userConnections.has(userId) && userConnections.get(userId).size > 0;
});

// Additional helper to send to all curator sockets
app.set('notifyCurators', (eventName: string, data: unknown) => {
  io.to(`role:${UserRole.CURATOR}`).to(`role:${UserRole.ADMIN}`).emit(eventName, data);
});

export { app, server };