'use client';

import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Button, Tabs, Empty, Spin, Typography, Badge, Tooltip } from 'antd';
import { useRouter } from 'next/navigation';
import { 
  BellOutlined, 
  CheckOutlined, 
  UserOutlined,
  PictureOutlined,
  EnvironmentOutlined,
  CommentOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { getAllNotifications } from '@/lib/api/notification';
import { Notification } from '@/contexts/NotificationContext';
import { formatDate, formatRelativeTime } from '@/utils/format';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

  // Fetch all notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { notifications } = await getAllNotifications(50);
        setAllNotifications(notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification.id);
      
      // Update local state
      setAllNotifications(prev => 
        prev.map(item => 
          item.id === notification.id
            ? { ...item, isRead: true }
            : item
        )
      );
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'artwork_upload':
        router.push(`/artworks/${notification.entityId}`);
        break;
      case 'artwork_approved':
      case 'artwork_rejected':
        router.push(`/artworks/${notification.entityId}`);
        break;
      case 'exhibition_created':
        router.push(`/exhibitions/${notification.entityId}`);
        break;
      case 'comment_added':
        router.push(`/artworks/${notification.entityId}?showComments=true`);
        break;
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'artwork_upload':
        return <PictureOutlined style={{ color: '#1890ff' }} />;
      case 'artwork_approved':
        return <CheckOutlined style={{ color: '#52c41a' }} />;
      case 'artwork_rejected':
        return <PictureOutlined style={{ color: '#ff4d4f' }} />;
      case 'exhibition_created':
        return <EnvironmentOutlined style={{ color: '#722ed1' }} />;
      case 'comment_added':
        return <CommentOutlined style={{ color: '#faad14' }} />;
      default:
        return <BellOutlined />;
    }
  };

  // Filter notifications by read status
  const unreadNotifications = allNotifications.filter(notification => !notification.isRead);
  const readNotifications = allNotifications.filter(notification => notification.isRead);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
            className="mr-3"
          />
          <Title level={2} className="m-0">
            Notifications
          </Title>
          {unreadCount > 0 && (
            <Badge count={unreadCount} className="ml-2" />
          )}
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={() => markAllAsRead()}>
            Mark all as read
          </Button>
        )}
      </div>
      
      <Card>
        <Tabs defaultActiveKey="all">
          <TabPane tab="All" key="all">
            <NotificationList 
              notifications={allNotifications}
              loading={loading}
              onItemClick={handleNotificationClick}
              emptyText="No notifications yet"
            />
          </TabPane>
          <TabPane tab={
            <Badge count={unreadCount} size="small" offset={[5, 0]}>
              <span>Unread</span>
            </Badge>
          } key="unread">
            <NotificationList 
              notifications={unreadNotifications}
              loading={loading}
              onItemClick={handleNotificationClick}
              emptyText="No unread notifications"
            />
          </TabPane>
          <TabPane tab="Read" key="read">
            <NotificationList 
              notifications={readNotifications}
              loading={loading}
              onItemClick={handleNotificationClick}
              emptyText="No read notifications"
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onItemClick: (notification: Notification) => void;
  emptyText: string;
}

const NotificationList: React.FC<NotificationListProps> = ({ 
  notifications, 
  loading, 
  onItemClick,
  emptyText
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Empty 
        description={emptyText}
        className="py-8"
      />
    );
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={notifications}
      renderItem={notification => (
        <List.Item
          key={notification.id}
          onClick={() => onItemClick(notification)}
          className={`cursor-pointer transition-colors duration-200 hover:bg-gray-50 ${
            !notification.isRead ? 'bg-blue-50' : ''
          }`}
        >
          <List.Item.Meta
            avatar={
              <Avatar 
                icon={notification.sender?.profileUrl ? null : <UserOutlined />}
                src={notification.sender?.profileUrl}
                size="large"
                className="flex items-center justify-center"
              >
                {!notification.sender?.profileUrl && notification.type}
              </Avatar>
            }
            title={
              <Text strong>{notification.message}</Text>
            }
            description={
              <div>
                <Text type="secondary">
                  {formatRelativeTime(notification.createdAt)}
                </Text>
                {!notification.isRead && (
                  <Badge status="processing" className="ml-2" />
                )}
              </div>
            }
          />
        </List.Item>
      )}
    />
  );
};