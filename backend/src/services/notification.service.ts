import { AppDataSource } from '../config/database';
import { Notification, NotificationType } from '../entities/Notification';
import { User, UserRole } from '../entities/User';
import { logger } from '../utils/logger';

export const createNotification = async (
  type: NotificationType,
  message: string,
  recipientId: string,
  senderId?: string,
  entityId?: string
): Promise<Notification> => {
  const notificationRepository = AppDataSource.getRepository(Notification);
  const notification = new Notification();
  
  notification.type = type;
  notification.message = message;
  notification.recipientId = recipientId;
  notification.senderId = senderId? senderId : "";
  notification.entityId = entityId? entityId : "";
  notification.isRead = false;
  
  return await notificationRepository.save(notification);
};

export const getUnreadNotificationsForUser = async (userId: string): Promise<Notification[]> => {
  const notificationRepository = AppDataSource.getRepository(Notification);
  
  return await notificationRepository.find({
    where: { recipientId: userId, isRead: false },
    relations: ['sender'],
    order: { createdAt: 'DESC' }
  });
};

export const getAllNotificationsForUser = async (userId: string, limit = 20): Promise<Notification[]> => {
  const notificationRepository = AppDataSource.getRepository(Notification);
  
  return await notificationRepository.find({
    where: { recipientId: userId },
    relations: ['sender'],
    order: { createdAt: 'DESC' },
    take: limit
  });
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRepository = AppDataSource.getRepository(Notification);
  
  await notificationRepository.update(
    { id: notificationId },
    { isRead: true }
  );
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const notificationRepository = AppDataSource.getRepository(Notification);
  
  await notificationRepository.update(
    { recipientId: userId, isRead: false },
    { isRead: true }
  );
};

export const getCuratorsForNotification = async (): Promise<User[]> => {
  const userRepository = AppDataSource.getRepository(User);
  
  return await userRepository.find({
    where: [
      { role: UserRole.CURATOR },
      { role: UserRole.ADMIN }
    ]
  });
};

export const notifyArtworkUpload = async (
  artworkId: string,
  title: string,
  artistId: string,
  artistName: string
): Promise<void> => {
  try {
    // Get all curators and admins
    const curators = await getCuratorsForNotification();
    
    // Create a notification for each curator
    const message = `${artistName} uploaded a new artwork: "${title}"`;
    
    const notifications = curators.map(curator => 
      createNotification(
        NotificationType.ARTWORK_UPLOAD,
        message,
        curator.id,
        artistId,
        artworkId
      )
    );
    
    await Promise.all(notifications);
    logger.info(`Created notifications for ${curators.length} curators about artwork upload: ${title}`);
  } catch (error) {
    logger.error('Error creating artwork upload notifications:', error);
  }
};

export const notifyArtworkApproval = async (
  artworkId: string,
  title: string,
  artistId: string,
  curatorName: string
): Promise<void> => {
  try {
    const message = `Your artwork "${title}" was approved by ${curatorName}`;
    const curators = await getCuratorsForNotification();

    const curator = curators.find(curator => curator.username === curatorName);

    await createNotification(
      NotificationType.ARTWORK_APPROVED,
      message,
      artistId,
      curator?.id,
      artworkId
    );
    
    logger.info(`Created notification for artist ${artistId} about artwork approval: ${title}`);
  } catch (error) {
    logger.error('Error creating artwork approval notification:', error);
  }
};