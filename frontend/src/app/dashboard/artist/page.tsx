'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Statistic, Empty, message, Spin, Alert, Badge } from 'antd';
import { PictureOutlined, UploadOutlined, CommentOutlined, StarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import { getArtworks } from '@/lib/api/index';
import { useNotifications } from '@/contexts/NotificationContext';
import { getSocketClient, authenticateSocket } from '@/lib/socketClient';
import ArtworkGrid from '@/components/artwork/ArtworkGrid';
import NotificationBadge from '@/components/notification/NotificationBadge';
import { Artwork } from '@/types/artwork.types';

const ArtistDashboard: React.FC = () => {
  const router = useRouter();
  const { notifications, unreadCount } = useNotifications();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentApprovals, setRecentApprovals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalArtworks: 0,
    pendingApproval: 0,
    exhibitionsFeatureIn: 0,
    totalViews: 0,
    totalLikes: 0,
    approvedArtworks: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all artworks by current artist
        const { artworks: fetchedArtworks } = await getArtworks({
          // This would use the current user's ID, but for now we'll just fetch all
          // artist: currentUser.id,
          limit: 100, // Fetch more to process on client side
        });

        // Separate artworks by status 
        // Note: This is a mock implementation. In a real app, you'd filter by the status field
        const pending = fetchedArtworks.filter(art => 
          !art.exhibitionItems || art.exhibitionItems.length === 0
        );
        const approved = fetchedArtworks.filter(art => 
          art.exhibitionItems && art.exhibitionItems.length > 0
        );

        setArtworks(fetchedArtworks);
        setPendingArtworks(pending);
        
        // Calculate statistics
        setStats({
          totalArtworks: fetchedArtworks.length,
          pendingApproval: pending.length,
          approvedArtworks: approved.length,
          exhibitionsFeatureIn: fetchedArtworks.reduce((total, art) => 
            total + (art.exhibitionItems?.length || 0), 0),
          totalViews: Math.floor(Math.random() * 1000), // Mock data
          totalLikes: Math.floor(Math.random() * 100), // Mock data
        });
      } catch (error) {
        console.error('Error fetching artist data:', error);
        message.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up Socket.IO for real-time notifications
    const socket = getSocketClient();
    authenticateSocket(crypto.randomUUID(), UserRole.ARTIST); // This would use actual user ID
    
    // Listen for artwork approval
    socket.on('artwork-approved', (data) => {
      console.log('Artwork approval notification received:', data);
      
      // Show toast notification
      message.success({
        content: `Your artwork "${data.title}" was approved by ${data.curatorName}`,
        duration: 5,
        onClick: () => {
          router.push(`/artworks/${data.id}`);
        }
      });
      
      // Add to recent approvals
      setRecentApprovals(prev => [
        {
          id: data.id,
          title: data.title,
          curatorName: data.curatorName,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
      
      // Update statistics
      setStats(prev => ({
        ...prev,
        pendingApproval: Math.max(0, prev.pendingApproval - 1),
        approvedArtworks: prev.approvedArtworks + 1
      }));
    });
    
    // Clean up socket connection on unmount
    return () => {
      socket.off('artwork-approved');
    };
  }, [router]);
  
  // Find approval notifications
  const approvalNotifications = notifications.filter(
    n => n.type === 'artwork_approved'
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Artist Dashboard</h1>
        <NotificationBadge />
      </div>
      
      {/* Recent Approval Alert */}
      {approvalNotifications.length > 0 && (
        <Alert
          message={
            <div className="flex items-center justify-between">
                <span style={{ display: 'flex', alignItems: 'center', color: '#52c41a' }}>
                  <CheckCircleOutlined style={{ marginRight: 8 }} />
                  {approvalNotifications.length === 1 
                    ? 'One of your artworks was recently approved!' 
                    : `${approvalNotifications.length} of your artworks were recently approved!`}
                </span>
              <Button 
                size="small" 
                type="primary"
                onClick={() => router.push('/notifications')}
              >
                View Details
              </Button>
            </div>
          }
          type="success"
          showIcon={false}
          closable
          className="mb-6"
          style={{ marginBottom: '1.5rem' }}
        />
      )}
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <Statistic 
            title="Total Artworks" 
            value={stats.totalArtworks} 
            prefix={<PictureOutlined />} 
          />
        </Card>
        <Card>
          <Statistic 
            title={
              <div className="flex items-center">
                <span>Pending Approval</span>
                {pendingArtworks.length > 0 && (
                  <Badge status="processing" style={{ marginLeft: '0.5rem' }} />
                )}
              </div>
            }
            value={stats.pendingApproval} 
            prefix={<UploadOutlined />} 
          />
        </Card>
        <Card>
          <Statistic 
            title={
              <div className="flex items-center">
                <span>Approved Artworks</span>
                {approvalNotifications.length > 0 && (
                  <Badge count={approvalNotifications.length} style={{ marginLeft: '0.5rem' }} />
                )}
              </div>
            }
            value={stats.approvedArtworks} 
            prefix={<CheckCircleOutlined />} 
            valueStyle={{ color: approvalNotifications.length > 0 ? '#52c41a' : undefined }}
          />
        </Card>
        <Card>
          <Statistic 
            title="Total Views" 
            value={stats.totalViews} 
            prefix={<CommentOutlined />} 
          />
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="space-x-4">
          <Button 
            type="primary" 
            icon={<UploadOutlined />} 
            onClick={() => router.push('/artworks/upload')}
          >
            Upload New Artwork
          </Button>
          <Button 
            onClick={() => router.push('/profile/edit')}
          >
            Edit Profile
          </Button>
        </div>
      </div>
      
      {/* Tabs for different artwork views */}
      <Card style={{ marginTop: '1.5rem' }}>
        <Tabs 
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: 'All Artworks',
              children: (
                loading ? (
                  <div className="flex justify-center py-10">
                    <Spin size="large" />
                  </div>
                ) : artworks.length > 0 ? (
                  <ArtworkGrid 
                    artworks={artworks} 
                    columns={3}
                    renderExtraInfo={(artwork) => (
                      <p className="text-xs text-gray-500 mt-1">
                        {artwork.exhibitionItems && artwork.exhibitionItems.length > 0 
                          ? `Featured in ${artwork.exhibitionItems.length} exhibition(s)` 
                          : 'Not featured in any exhibitions'}
                      </p>
                    )}
                  />
                ) : (
                  <Empty description="No artworks yet" />
                )
              )
            },
            {
              key: 'pending',
              label: (
                <Badge dot={pendingArtworks.length > 0}>
                  <span>Pending Approval</span>
                </Badge>
              ),
              children: (
                loading ? (
                  <div className="flex justify-center py-10">
                    <Spin size="large" />
                  </div>
                ) : pendingArtworks.length > 0 ? (
                  <ArtworkGrid 
                    artworks={pendingArtworks} 
                    columns={3}
                  />
                ) : (
                  <Empty description="No artworks pending approval" />
                )
              )
            },
            {
              key: 'approved',
              label: (
                <Badge count={approvalNotifications.length > 0 ? approvalNotifications.length : 0} showZero={false}>
                  <span>Recently Approved</span>
                </Badge>
              ),
              children: (
                loading ? (
                  <div className="flex justify-center py-10">
                    <Spin size="large" />
                  </div>
                ) : (
                  <ArtworkGrid 
                    artworks={artworks.filter(art => 
                      art.exhibitionItems && art.exhibitionItems.length > 0
                    )} 
                    columns={3}
                    emptyText="None of your artworks have been approved yet"
                  />
                )
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default withProtectedRoute(ArtistDashboard, {
  requiredRoles: [UserRole.ARTIST, UserRole.ADMIN],
  redirectTo: '/unauthorized',
})