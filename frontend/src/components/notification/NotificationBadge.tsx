import React, { useState, useEffect } from 'react';
import { Badge, Tooltip, Button, Popover, List, Avatar, Space, Typography, Empty } from 'antd';
import { BellOutlined, CheckOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatRelativeTime } from '@/utils/format';

const { Text } = Typography;

interface NotificationBadgeProps {
  maxItems?: number;
  simple?: boolean;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  maxItems = 5,
  simple = false,
  className = ''
}) => {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  
  // Filter to get only the most recent notifications
  const recentNotifications = notifications.slice(0, maxItems);
  
  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Close the popover
    setOpen(false);
    
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
  
  // Animate the badge when count changes
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);
  
  // Simple version just shows the badge with count
  if (simple) {
    return (
      <Badge 
        count={unreadCount} 
        className={`transition-all duration-300 ${isAnimating ? 'scale-125' : 'scale-100'} ${className}`}
      >
        <BellOutlined style={{ fontSize: 20 }} />
      </Badge>
    );
  }
  
  // Content for the popover
  const notificationContent = (
    <div style={{ width: 300, maxHeight: 400 }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Button 
            size="small" 
            onClick={() => markAllAsRead()}
            icon={<CheckOutlined />}
          >
            Mark all read
          </Button>
        )}
      </div>
      
      {/* Notifications list */}
      {recentNotifications.length > 0 ? (
        <List
          dataSource={recentNotifications}
          renderItem={notification => (
            <List.Item 
              className={`cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    size="small"
                    icon={<UserOutlined />}
                    src={notification.sender?.profileUrl}
                  />
                }
                title={
                  <Space>
                    <Text ellipsis>{notification.message}</Text>
                    {!notification.isRead && <Badge status="processing" />}
                  </Space>
                }
                description={
                  <Text type="secondary" className="text-xs">
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
          className="my-4"
        />
      )}
      
      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-gray-100 text-center">
        <Button 
          type="link" 
          size="small"
          onClick={() => {
            router.push('/notifications');
            setOpen(false);
          }}
        >
          View all notifications
        </Button>
      </div>
    </div>
  );
  
  return (
    <Popover
      content={notificationContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={true}
      className={className}
    >
      <Badge 
        count={unreadCount} 
        className={`transition-all duration-300 ${isAnimating ? 'scale-125' : 'scale-100'}`}
        offset={[-2, 2]}
      >
        <Tooltip title="Notifications">
          <Button 
            type="text" 
            icon={<BellOutlined style={{ fontSize: 20 }} />}
            className="flex items-center justify-center"
          />
        </Tooltip>
      </Badge>
    </Popover>
  );
};

export default NotificationBadge;