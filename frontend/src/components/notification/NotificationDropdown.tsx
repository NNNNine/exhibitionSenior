import React, { useState } from 'react';
import { Badge, Dropdown, List, Avatar, Button, Empty, Typography, Spin, Tooltip } from 'antd';
import { 
  BellOutlined, 
  CheckOutlined, 
  UserOutlined, 
  PictureOutlined, 
  EnvironmentOutlined,
  CommentOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/utils/format';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/types/notification.types';

const { Text } = Typography;

const NotificationDropdown: React.FC = () => {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
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
      default:
        // Default action - just close the dropdown
        setOpen(false);
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

  // Create notification menu content
  const notificationMenu = {
    items: [{
      key: 'notification-content',
      label: (
        <div className="bg-white rounded-md shadow-lg overflow-hidden" style={{ width: 360, maxHeight: 480 }}>
          <div className="py-2 px-4 border-b border-gray-200 flex justify-between items-center">
            <Text strong>Notifications</Text>
            {unreadCount > 0 && (
              <Button size="small" onClick={() => markAllAsRead()}>
                Mark all as read
              </Button>
            )}
          </div>
          
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div className="flex justify-center py-6">
                <Spin />
              </div>
            ) : notifications && notifications.length > 0 ? (
              <List
                dataSource={notifications}
                renderItem={(notification) => (
                    <List.Item
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        backgroundColor: !notification.isRead ? '#e6f7ff' : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = !notification.isRead ? '#e6f7ff' : 'transparent')}
                    >
                    <List.Item.Meta
                      avatar={
                      <Avatar
                        icon={notification.sender?.profileUrl ? null : <UserOutlined />}
                        src={notification.sender?.profileUrl}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                      }
                      title={
                      <div style={{ fontWeight: 500 }}>
                        {notification.message}
                      </div>
                      }
                      description={
                      <Text type="secondary" style={{ fontSize: '0.75rem', lineHeight: 1.33 }}>
                        {formatRelativeTime(notification.createdAt)}
                      </Text>
                      }
                    />
                    </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No notifications"
                style={{ marginTop: '2rem', marginBottom: '2rem' }}
              />
            )}
          </div>
          
          <div className="py-2 px-4 border-t border-gray-200 text-center">
            <Button 
              type="link" 
              size="small"
              onClick={() => router.push('/notifications')}
            >
              View all notifications
            </Button>
          </div>
        </div>
      ),
    }]
  };

  return (
    <Dropdown
      menu={notificationMenu}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      arrow
      placement="bottomRight"
    >
      <div className="cursor-pointer p-1">
        <Badge count={unreadCount} overflowCount={99}>
          <Tooltip title="Notifications">
            <Button 
              type="text" 
              icon={<BellOutlined style={{ fontSize: '20px', color: 'white' }} />} 
              style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', color: 'white' }}
              size="large"
            />
          </Tooltip>
        </Badge>
      </div>
    </Dropdown>
  );
};

export default NotificationDropdown;