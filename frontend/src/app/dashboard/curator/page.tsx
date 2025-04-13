'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Statistic, Table, Tag, message, Spin, Modal, Tooltip, Badge, Alert, Drawer, List, Avatar, Empty, Space, Image, Popconfirm, Input, Divider } from 'antd';
import { 
  PlusOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  BellOutlined, 
  PictureOutlined, 
  UserOutlined, 
  SettingOutlined, 
  LayoutOutlined,
  DeleteOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import { getExhibition, getArtworks, approveArtwork, rejectArtwork, deleteArtwork } from '@/lib/api/index';
import { useNotifications } from '@/contexts/NotificationContext';
import { Exhibition } from '@/types/exhibition.types';
import { Artwork, ArtworkStatus } from '@/types/artwork.types';
import { formatDate, formatImageUrl } from '@/utils/format';
import { getSocketClient, authenticateSocket } from '@/lib/socketClient';
import CuratorNavLinks from '@/components/curator/CuratorNavLink';

const CuratorDashboard: React.FC = () => {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [rejectionModalVisible, setRejectionModalVisible] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [exhibition, setExhibition] = useState<Exhibition>();
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    pendingApproval: 0,
    totalArtworks: 0,
    totalUsers: 0,
    activeExhibitions: 0
  });

  const [pagination, setPagination] = useState({
      current: 1,
      pageSize: 10,
      total: 0
  });
  
  // State for notification drawer
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  
  // State for new artwork notifications
  const [newArtworkNotifications, setNewArtworkNotifications] = useState<any[]>([]);

  // State for handle message
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all exhibitions curated by current user
        const {exhibition: fetchedExhibition} = await getExhibition();
        setExhibition(fetchedExhibition);
        
        // Update statistics with actual counts
        setStats(prev => ({
          ...prev,
          totalUsers: 25,     // This would come from an actual API call
          activeExhibitions: fetchedExhibition?.isActive ? 1 : 0,
        }));
      } catch (error) {
        console.error('Error fetching curator data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchArtworksData(pagination.current, pagination.pageSize);

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

  const fetchArtworksData = async (
      page = pagination.current, 
      pageSize = pagination.pageSize, 
    ) => {
      setLoading(true);
      try {
        const params: any = {
          page,
          limit: pageSize,
          status: ArtworkStatus.PENDING // Specifically fetch only pending artworks
        };
        
        const { artworks: fetchedArtworks, pagination: paginationData } = await getArtworks(params);

        fetchedArtworks.filter((artwork) => {
          return artwork.status === ArtworkStatus.PENDING;
        })
        
        setPendingArtworks(fetchedArtworks);
        setPagination({
          current: paginationData.page,
          pageSize: paginationData.limit,
          total: paginationData.total
        });
        
        // Update the pending approval stat
        setStats(prev => ({
          ...prev,
          totalArtworks: fetchedArtworks.length,
          pendingApproval: paginationData.total
        }));
      } catch (error) {
        console.error('Error fetching artworks:', error);
        setError('Failed to load artworks');
      } finally {
        setLoading(false);
      }
    };
  
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
      setSuccessMessage('Artwork approved successfully');

      pendingArtworks.filter((artwork) => {
        return artwork.status === ArtworkStatus.PENDING;
      })
      
      // Update local state
      setPendingArtworks(prev => 
        prev.filter(artwork => artwork.id !== artworkId)
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApproval: Math.max(0, prev.pendingApproval - 1)
      }));
    } catch (error) {
      console.error('Failed to approve artwork:', error);
      setError('Failed to approve artwork');
    }
  };

  // Handle artwork rejection modal
  const handleRejectClick = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setRejectionModalVisible(true);
  };

  // Handle artwork rejection submission
  const handleRejectArtwork = async () => {
    if (!selectedArtwork) return;
    
    try {
      await rejectArtwork(selectedArtwork.id, rejectReason);
      setSuccessMessage('Artwork rejected successfully');

      pendingArtworks.filter((artwork) => {
        return artwork.status === ArtworkStatus.PENDING;
      })
      
      // Update local state
      setPendingArtworks(prev => 
        prev.filter(artwork => artwork.id !== selectedArtwork.id)
      );
      
      // Close modal and reset
      setRejectionModalVisible(false);
      setRejectReason('');
      setSelectedArtwork(null);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApproval: Math.max(0, prev.pendingApproval - 1)
      }));
    } catch (error) {
      console.error('Failed to reject artwork:', error);
      setError('Failed to reject artwork');
    }
  };
  
  // Handle artwork deletion
  const handleDeleteArtwork = async (artworkId: string) => {
    try {
      await deleteArtwork(artworkId);
      setSuccessMessage('Artwork deleted successfully');

      pendingArtworks.filter((artwork) => {
        return artwork.status === ArtworkStatus.PENDING;
      })
      
      // Remove from local state
      setPendingArtworks(prev => prev.filter(artwork => artwork.id !== artworkId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApproval: Math.max(0, prev.pendingApproval - 1),
        totalArtworks: Math.max(0, prev.totalArtworks - 1)
      }));
    } catch (error) {
      console.error('Failed to delete artwork:', error);
      message.error('Failed to delete artwork');
    }
  };

  const handleViewDetails = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setDetailModalVisible(true);
  };

  // Define columns for the pending approvals table
  const pendingColumns = [
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnailUrl',
      key: 'thumbnailUrl',
      width: 120,
      render: (text: string, record: Artwork) => (
        <Image 
          src={formatImageUrl(text || record.fileUrl)} 
          alt={record.title}
          width={80}
          height={80}
          style={{ objectFit: 'cover' }}
          fallback="/images/placeholder-image.png"
        />
      ),
    },
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        render: (text: string, record: Artwork) => (
          <Button 
            type="link" 
            onClick={() => router.push(`/artworks/${record.id}`)}
          >
            {text}
          </Button>
        ),
      },
      {
        title: 'Artist',
        dataIndex: 'artist',
        key: 'artist',
        render: (artist: any, record: Artwork) => (
          <Button 
            type="link" 
            onClick={() => artist && router.push(`/profile/${artist.username}`)}
          >
            {artist?.username || `Artist #${record.artistId}`}
          </Button>
        ),
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        render: (text: string) => <Tag color="blue">{text}</Tag>,
      },
      {
        title: 'Uploaded',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date: string) => formatDate(date),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: ArtworkStatus) => {
          let color: 'success' | 'error' | 'warning' | 'default' | 'processing' | undefined = undefined;
          let text = '';
          
          switch (status) {
            case ArtworkStatus.APPROVED:
              color = 'success';
              text = 'Approved';
              break;
            case ArtworkStatus.REJECTED:
              color = 'error';
              text = 'Rejected';
              break;
            case ArtworkStatus.PENDING:
            default:
              color = 'warning';
              text = 'Pending';
              break;
          }
          
          return <Badge status={color} text={text} />;
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: Artwork) => (
          <Space size="small">
            <Tooltip title="View Details">
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => handleViewDetails(record)} 
                size="small"
              />
            </Tooltip>
            
            {record.status === ArtworkStatus.PENDING && (
              <>
                <Tooltip title="Approve Artwork">
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />} 
                    size="small"
                    onClick={() => handleApproveArtwork(record.id)}
                  />
                </Tooltip>
                
                <Tooltip title="Reject Artwork">
                  <Button 
                    danger 
                    icon={<CloseCircleOutlined />} 
                    size="small"
                    onClick={() => handleRejectClick(record)}
                  />
                </Tooltip>
                <Tooltip title="Delete Artwork">
                  <Popconfirm
                    title="Are you sure you want to delete this artwork?"
                    onConfirm={() => handleDeleteArtwork(record.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button 
                      danger 
                      icon={<DeleteOutlined />} 
                      size="small"
                    />
                  </Popconfirm>
                </Tooltip>
              </>
            )}
          </Space>
        ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Curator Dashboard</h1>
      
      {/* Navigation Menu */}
      <CuratorNavLinks />

      {/* Error Message */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          // className="mb-6"
          style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }} 
          closable
          onClose={() => setError(null)}
        />
      )}

      {successMessage && (
        <Alert 
          message="Success" 
          description={successMessage} 
          type="success" 
          showIcon 
          // className="mb-4"
          style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }} 
          closable
          onClose={() => setSuccessMessage(null)}
        />
      )}
      
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
          style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}
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
                      <Card title="Current Exhibition" variant="borderless">
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

      {/* Artwork Rejection Modal */}
      <Modal
        title="Reject Artwork"
        open={rejectionModalVisible}
        onCancel={() => {
          setRejectionModalVisible(false);
          setRejectReason('');
          setSelectedArtwork(null);
        }}
        onOk={handleRejectArtwork}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <div className="py-2">
          <p className="mb-4">
            Please provide a reason for rejecting 
            <strong> &quot;{selectedArtwork?.title}&quot;</strong>
          </p>
          
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Explain why this artwork is being rejected..."
          />
          
          <div className="mt-4 flex items-center text-gray-500">
            <InfoCircleOutlined className="mr-2" />
            <small>
              This reason will be sent to the artist to help them understand why their artwork was rejected.
            </small>
          </div>
        </div>
      </Modal>

      {/* Artwork Details Modal */}
      {selectedArtwork && (
        <Modal
          title="Artwork Details"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              Close
            </Button>,
            <Button 
              key="view" 
              type="primary" 
              onClick={() => router.push(`/artworks/${selectedArtwork.id}`)}
            >
              View Full Page
            </Button>
          ]}
          width={720}
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <Image
                src={formatImageUrl(selectedArtwork.fileUrl)}
                alt={selectedArtwork.title}
                className="w-full"
              />
            </div>
            
            <div className="w-full md:w-1/2">
              <h3 className="text-xl font-bold mb-2">{selectedArtwork.title}</h3>
              
              <p className="mb-4">
                By: <strong>{selectedArtwork.artist?.username || `Artist #${selectedArtwork.artistId}`}</strong>
              </p>
              
              <Divider orientation="left">Details</Divider>
              
              <p className="whitespace-pre-line mb-4">{selectedArtwork.description}</p>
              
              <p>
                <strong>Category:</strong> {selectedArtwork.category}
              </p>
              
              <p>
                <strong>Creation Date:</strong> {formatDate(selectedArtwork.creationDate)}
              </p>
              
              <p>
                <strong>Upload Date:</strong> {formatDate(selectedArtwork.createdAt)}
              </p>
              
              <div className="mt-4">
                <strong>Tags:</strong>{' '}
                {selectedArtwork.tags && selectedArtwork.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedArtwork.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">No tags</span>
                )}
              </div>
              
              <div className="mt-4">
                <strong>Status:</strong>{' '}
                <Tag 
                  color={
                    selectedArtwork.status === ArtworkStatus.APPROVED ? 'green' :
                    selectedArtwork.status === ArtworkStatus.REJECTED ? 'red' : 'orange'
                  }
                >
                  {selectedArtwork.status}
                </Tag>
              </div>
            </div>
          </div>
        </Modal>
      )}
      
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