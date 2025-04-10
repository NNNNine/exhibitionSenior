import 'dotenv/config';
import { AppDataSource } from './config/database';
import { server } from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

// Improved error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
async function startServer() {
  try {
    // Initialize database connection
    logger.info('Initializing database connection...');
    await AppDataSource.initialize();
    logger.info('Database connection established');

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();