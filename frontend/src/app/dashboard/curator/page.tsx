'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Statistic, Table, Tag, message, Spin, Modal, Tooltip, Badge, Alert, Drawer, List, Avatar, Empty, Space, Image } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, BellOutlined, PictureOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import { getExhibition, getArtworks } from '@/lib/api/index';
import { useNotifications } from '@/contexts/NotificationContext';
// import ExhibitionGrid from '@/components/exhibition/ExhibitionGrid';
import { Exhibition } from '@/types/exhibition.types';
import { Artwork } from '@/types/artwork.types';
import { formatDate, formatImageUrl } from '@/utils/format';
import { getSocketClient, authenticateSocket } from '@/lib/socketClient';

const CuratorDashboard: React.FC = () => {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  const [exhibition, setExhibition] = useState<Exhibition>();
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    pendingApproval: 0,
    totalArtworks: 0,
  });
  
  // State for notification drawer
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  
  // State for new artwork notifications
  const [newArtworkNotifications, setNewArtworkNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all exhibitions curated by current user
        const fetchedExhibition = await getExhibition();

        // Get all artworks pending approval (mock data - would be a status field)
        const { artworks: fetchedArtworks } = await getArtworks({
          limit: 100,
        });
        
        // For demo purposes, let's assume a portion of artworks are pending approval
        const pendingArts = fetchedArtworks.slice(0, Math.min(5, fetchedArtworks.length));

        setExhibition(fetchedExhibition);
        setPendingArtworks(pendingArts);
        
        // Calculate statistics
        setStats({
          pendingApproval: pendingArts.length,
          totalArtworks: fetchedArtworks.length,
        });
      } catch (error) {
        console.error('Error fetching curator data:', error);
        message.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up Socket.IO for real-time notifications
    const socket = getSocketClient();
    authenticateSocket(crypto.randomUUID(), UserRole.CURATOR); // This would use actual user ID
    
    // Listen for new artwork uploads
    socket.on('new-artwork', (data) => {
      console.log('New artwork notification received:', data);
      
      // Show toast notification
      message.info({
        content: `${data.artist} uploaded a new artwork: "${data.title}"`,
        duration: 5,
        onClick: () => {
          router.push(`/artworks/${data.id}`);
        }
      });
      
      // Add to new artwork notifications list
      setNewArtworkNotifications(prev => [
        {
          id: data.id,
          title: data.title,
          artist: data.artist,
          thumbnailUrl: data.thumbnailUrl,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
      
      // Update pending approval count
      setStats(prev => ({
        ...prev,
        pendingApproval: prev.pendingApproval + 1
      }));
    });
    
    // Clean up socket connection on unmount
    return () => {
      socket.off('new-artwork');
    };
  }, [router]);
  
  // Filter notifications to show only artwork upload notifications
  const artworkUploadNotifications = notifications.filter(
    notification => notification.type === 'artwork_upload'
  );

  // Mock function to handle artwork approval
  const handleApproveArtwork = (artwork: Artwork) => {
    Modal.confirm({
      title: 'Approve Artwork',
      content: `Are you sure you want to approve "${artwork.title}"?`,
      onOk: () => {
        setPendingArtworks(prev => prev.filter(a => a.id !== artwork.id));
        setStats(prev => ({
          ...prev, 
          pendingApproval: prev.pendingApproval - 1
        }));
        message.success(`Artwork "${artwork.title}" has been approved`);
      }
    });
  };

  // Mock function to handle artwork rejection
  const handleRejectArtwork = (artwork: Artwork) => {
    Modal.confirm({
      title: 'Reject Artwork',
      content: `Are you sure you want to reject "${artwork.title}"?`,
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: () => {
        setPendingArtworks(prev => prev.filter(a => a.id !== artwork.id));
        setStats(prev => ({
          ...prev, 
          pendingApproval: prev.pendingApproval - 1
        }));
        message.success(`Artwork "${artwork.title}" has been rejected`);
      }
    });
  };

  // Define columns for the pending approvals table
  const pendingColumns = [
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnailUrl',
      key: 'thumbnailUrl',
      render: (text: string, record: Artwork) => (
        <Image 
          src={formatImageUrl(record.thumbnailUrl || record.fileUrl)}
          alt={record.title} 
          style={{ width: 60, height: 60, objectFit: 'cover' }} 
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Artist',
      dataIndex: 'artist',
      key: 'artist',
      render: (artist: any) => artist?.username || 'Unknown Artist',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => formatDate(text),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Artwork) => (
        <div className="space-x-2">
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => router.push(`/artworks/${record.id}`)} 
              size="small" 
            />
          </Tooltip>
          <Tooltip title="Approve">
            <Button 
              icon={<CheckCircleOutlined />} 
              onClick={() => handleApproveArtwork(record)} 
              type="primary" 
              size="small" 
            />
          </Tooltip>
          <Tooltip title="Reject">
            <Button 
              icon={<CloseCircleOutlined />} 
              onClick={() => handleRejectArtwork(record)} 
              danger 
              size="small" 
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate to artwork
    if (notification.entityId) {
      router.push(`/artworks/${notification.entityId}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Curator Dashboard</h1>
      
      {/* Real-time notification banner */}
      {unreadCount > 0 && (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <div>
                <Badge count={unreadCount} className="mr-2" />
                You have {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
              </div>
              <Button 
                size="small" 
                onClick={() => setNotificationDrawerOpen(true)}
              >
                View Notifications
              </Button>
            </div>
          }
          type="info"
          showIcon
          closable
          style={{ marginBottom: '1.5rem' }}
        />
      )}
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <Statistic 
            title="Pending Approval" 
            value={stats.pendingApproval} 
            prefix={<PlusOutlined />} 
            valueStyle={{ color: unreadCount > 0 ? '#ff4d4f' : undefined }}
          />
          {unreadCount > 0 && (
            <Badge count={unreadCount} offset={[-10, 0]}>
              <div />
            </Badge>
          )}
        </Card>
        <Card>
          <Statistic 
            title="Total Artworks" 
            value={stats.totalArtworks} 
            prefix={<PlusOutlined />} 
          />
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="space-x-4">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => router.push('/exhibitions/edit')}
          >
            Edit Exhibition
          </Button>
          <Button 
            onClick={() => router.push('/profile/edit')}
          >
            Edit Profile
          </Button>
        </div>
      </div>
      
      {/* Tabs for different views */}
      <Card style={{ marginTop: '1.5rem' }}>
        <Tabs 
          defaultActiveKey="pending"
          items={[
            {
              key: 'pending',
              label: (
                <Badge count={unreadCount} dot>
                  <span>Pending Approvals</span>
                </Badge>
              ),
              children: (
                <div>
                  {/* New Artworks Banner */}
                  {newArtworkNotifications.length > 0 && (
                    <Alert
                      message={`${newArtworkNotifications.length} new artwork${newArtworkNotifications.length > 1 ? 's' : ''} uploaded recently`}
                      type="info"
                      showIcon
                      action={
                        <Button size="small" onClick={() => setNewArtworkNotifications([])}>
                          Dismiss
                        </Button>
                      }
                      style={{ marginBottom: '1rem' }}
                    />
                  )}
                  
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <Spin size="large" />
                    </div>
                  ) : (
                    <Table 
                      dataSource={pendingArtworks}
                      columns={pendingColumns}
                      rowKey="id"
                      pagination={false}
                    />
                  )}
                </div>
              )
            },
          ]}
        />
      </Card>
      
      {/* Notifications Drawer */}
      <Drawer
        title={
          <div className="flex items-center">
            <BellOutlined style={{ marginRight: '0.5rem' }} />
              <span>Notifications</span>
            <Badge count={unreadCount} style={{ marginLeft: '0.5rem' }} />
          </div>
        }
        placement="right"
        onClose={() => setNotificationDrawerOpen(false)}
        open={notificationDrawerOpen}
        width={400}
      >
        {artworkUploadNotifications.length > 0 ? (
          <List
            dataSource={artworkUploadNotifications}
            renderItem={notification => (
              <List.Item
                key={notification.id}
                onClick={() => {
                  handleNotificationClick(notification);
                  setNotificationDrawerOpen(false);
                }}
                style={{
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  backgroundColor: !notification.isRead ? '#e6f7ff' : 'transparent',
                }}
                >
                <List.Item.Meta
                  avatar={
                    <Avatar icon={<PictureOutlined />} />
                  }
                  title={
                    <Space>
                      {notification.message}
                      {!notification.isRead && <Badge status="processing" />}
                    </Space>
                  }
                  description={
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.createdAt, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No notifications" />
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            type="link"
            onClick={() => {
              router.push('/notifications');
              setNotificationDrawerOpen(false);
            }}
          >
            View all notifications
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default withProtectedRoute(CuratorDashboard, {
  requiredRoles: [UserRole.CURATOR, UserRole.ADMIN],
  redirectTo: '/unauthorized',
});