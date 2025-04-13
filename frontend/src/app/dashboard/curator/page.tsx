'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Statistic, Table, Tag, message, Spin, Modal, Tooltip, Badge, Alert, Drawer, List, Avatar, Empty, Space, Image } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, BellOutlined, PictureOutlined, UserOutlined, SettingOutlined, LayoutOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import { getExhibition, getArtworks, approveArtwork, rejectArtwork } from '@/lib/api/index';
import { useNotifications } from '@/contexts/NotificationContext';
import { Exhibition } from '@/types/exhibition.types';
import { Artwork, ArtworkStatus } from '@/types/artwork.types';
import { formatDate, formatImageUrl } from '@/utils/format';
import { getSocketClient, authenticateSocket } from '@/lib/socketClient';
import CuratorNavLinks from '@/components/curator/CuratorNavLink';

const CuratorDashboard: React.FC = () => {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  const [exhibition, setExhibition] = useState<Exhibition>();
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    pendingApproval: 0,
    totalArtworks: 0,
    totalUsers: 0,
    activeExhibitions: 0
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
        const {exhibition: fetchedExhibition} = await getExhibition();

        // Get all artworks pending approval
        const { artworks: fetchedArtworks } = await getArtworks({
          status: ArtworkStatus.PENDING,
          limit: 5,
        });
        
        const pendingArts = fetchedArtworks;

        setExhibition(fetchedExhibition);
        setPendingArtworks(pendingArts);
        
        // Calculate statistics
        setStats({
          pendingApproval: pendingArts.length,
          totalArtworks: 100, // This would come from an actual API call
          totalUsers: 25,     // This would come from an actual API call
          activeExhibitions: fetchedExhibition?.isActive ? 1 : 0,
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

  // Handle artwork approval
  const handleApproveArtwork = async (artworkId: string) => {
    try {
      await approveArtwork(artworkId);
      message.success('Artwork approved successfully');
      
      // Update local state by removing the approved artwork from pending list
      setPendingArtworks(prev => prev.filter(artwork => artwork.id !== artworkId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApproval: Math.max(0, prev.pendingApproval - 1)
      }));
    } catch (error) {
      console.error('Error approving artwork:', error);
      message.error('Failed to approve artwork');
    }
  };

  // Handle artwork rejection
  const handleRejectArtwork = async (artworkId: string) => {
    try {
      await rejectArtwork(artworkId);
      message.success('Artwork rejected successfully');
      
      // Update local state by removing the rejected artwork from pending list
      setPendingArtworks(prev => prev.filter(artwork => artwork.id !== artworkId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApproval: Math.max(0, prev.pendingApproval - 1)
      }));
    } catch (error) {
      console.error('Error rejecting artwork:', error);
      message.error('Failed to reject artwork');
    }
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
              onClick={() => handleApproveArtwork(record.id)}
              type="primary" 
              size="small" 
            />
          </Tooltip>
          <Tooltip title="Reject">
            <Button 
              icon={<CloseCircleOutlined />} 
              onClick={() => handleRejectArtwork(record.id)}
              danger 
              size="small" 
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Curator Dashboard</h1>
      
      {/* Navigation Menu */}
      <CuratorNavLinks />
      
      {/* Real-time notification banner */}
      {unreadCount > 0 && (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <div>
                <Badge count={unreadCount} style={{ marginRight: '0.5rem' }} />
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
            title={<div className="flex items-center">
              <span>Pending Approval</span>
              {unreadCount > 0 && <Badge status="processing" style={{ marginLeft: '0.5rem' }} />}
            </div>}
            value={stats.pendingApproval} 
            prefix={<PictureOutlined />} 
            valueStyle={{ color: unreadCount > 0 ? '#ff4d4f' : undefined }}
          />
          <div className="mt-4">
            <Button 
              type="primary" 
              size="small"
              onClick={() => router.push('/curator/manage/artwork?status=pending')}
            >
              Manage Approvals
            </Button>
          </div>
        </Card>
        <Card>
          <Statistic 
            title="Total Artworks" 
            value={stats.totalArtworks} 
            prefix={<PictureOutlined />} 
          />
          <div className="mt-4">
            <Button 
              type="primary" 
              size="small"
              onClick={() => router.push('/curator/manage/artwork')}
            >
              Manage Artworks
            </Button>
          </div>
        </Card>
        <Card>
          <Statistic 
            title="Total Users" 
            value={stats.totalUsers} 
            prefix={<UserOutlined />} 
          />
          <div className="mt-4">
            <Button 
              type="primary" 
              size="small"
              onClick={() => router.push('/curator/manage/user')}
            >
              Manage Users
            </Button>
          </div>
        </Card>
        <Card>
          <Statistic 
            title="Exhibition Status" 
            value={exhibition?.isActive ? 'Active' : 'Inactive'} 
            prefix={<SettingOutlined />} 
          />
          <div className="mt-4">
            <Button 
              type="primary" 
              size="small"
              onClick={() => router.push('/curator/layout')}
            >
              Layout Editor
            </Button>
          </div>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="space-x-4">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => router.push('/exhibitions/create')}
          >
            Create Exhibition
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
                  ) : pendingArtworks.length > 0 ? (
                    <Table 
                      dataSource={pendingArtworks}
                      columns={pendingColumns}
                      rowKey="id"
                      pagination={false}
                    />
                  ) : (
                    <Empty 
                      description="No artworks pending approval" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                  
                  {pendingArtworks.length > 0 && (
                    <div className="mt-4 text-right">
                      <Button
                        type="primary"
                        onClick={() => router.push('/curator/manage/artwork?status=pending')}
                      >
                        View All Pending Artworks
                      </Button>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'management',
              label: 'Exhibition Management',
              children: (
                <div>
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <Spin size="large" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card title="Current Exhibition" bordered={false}>
                        {exhibition ? (
                          <div>
                            <h3 className="text-lg font-medium mb-2">{exhibition.title}</h3>
                            <p className="text-gray-500 mb-4">{exhibition.description.substring(0, 150)}...</p>
                            <p>
                              <strong>Status:</strong>{' '}
                              <Tag color={exhibition.isActive ? 'green' : 'orange'}>
                                {exhibition.isActive ? 'Active' : 'Inactive'}
                              </Tag>
                            </p>
                            <p>
                              <strong>Period:</strong>{' '}
                              {formatDate(exhibition.startDate)} to {formatDate(exhibition.endDate)}
                            </p>
                            <div className="mt-4">
                              <Button
                                type="primary"
                                onClick={() => router.push(`/exhibitions/${exhibition.id}`)}
                              >
                                View Exhibition
                              </Button>
                              <Button
                                style={{ marginLeft: '0.5rem' }}
                                onClick={() => router.push(`/exhibitions/${exhibition.id}/edit`)}
                              >
                                Edit Exhibition
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-gray-500 mb-4">No active exhibition</p>
                            <Button 
                              type="primary"
                              onClick={() => router.push('/exhibitions/create')}
                            >
                              Create Exhibition
                            </Button>
                          </div>
                        )}
                      </Card>
                      
                      <Card title="Layout Editor" bordered={false}>
                        <p className="text-gray-500 mb-4">
                          Arrange artworks in the 3D exhibition space with the layout editor.
                        </p>
                        <div className="text-center">
                          <Button 
                            type="primary" 
                            size="large"
                            onClick={() => router.push('/curator/layout')}
                            icon={<LayoutOutlined />}
                          >
                            Open Layout Editor
                          </Button>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              )
            }
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
  requiredRoles: [UserRole.CURATOR],
  redirectTo: '/unauthorized',
});