export enum NotificationType {
  ARTWORK_UPLOAD = 'artwork_upload',
  ARTWORK_APPROVED = 'artwork_approved',
  ARTWORK_REJECTED = 'artwork_rejected',
  EXHIBITION_CREATED = 'exhibition_created',
  COMMENT_ADDED = 'comment_added'
}

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