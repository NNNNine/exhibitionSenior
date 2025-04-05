'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Statistic, Table, Tag, message, Spin, Modal, Tooltip } from 'antd';
import { EnvironmentOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import { getExhibitions, getArtworks } from '@/lib/api/index';
import ExhibitionGrid from '@/components/exhibition/ExhibitionGrid';
import { Exhibition } from '@/types/exhibition.types';
import { Artwork } from '@/types/artwork.types';
import { formatDate } from '@/utils/format';

const { TabPane } = Tabs;

const CuratorDashboard: React.FC = () => {
  const router = useRouter();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalExhibitions: 0,
    activeExhibitions: 0,
    pendingApproval: 0,
    totalArtworks: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all exhibitions curated by current user
        const { exhibitions: fetchedExhibitions } = await getExhibitions({
          // This would filter by curator ID in a real implementation
          // curator: currentUser.id,
          limit: 100,
        });

        // Get all artworks pending approval (mock data - would be a status field)
        const { artworks: fetchedArtworks } = await getArtworks({
          limit: 100,
        });
        
        // For demo purposes, let's assume a portion of artworks are pending approval
        const pendingArts = fetchedArtworks.slice(0, Math.min(5, fetchedArtworks.length));

        setExhibitions(fetchedExhibitions);
        setPendingArtworks(pendingArts);
        
        // Calculate statistics
        setStats({
          totalExhibitions: fetchedExhibitions.length,
          activeExhibitions: fetchedExhibitions.filter(ex => ex.isActive).length,
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
  }, []);

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
        <img 
          src={text || `https://placehold.co/100x100?text=${encodeURIComponent(record.title)}`} 
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

  return (
    <ProtectedRoute requiredRoles={[UserRole.CURATOR, UserRole.ADMIN]}>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Curator Dashboard</h1>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <Statistic 
              title="Total Exhibitions" 
              value={stats.totalExhibitions} 
              prefix={<EnvironmentOutlined />} 
            />
          </Card>
          <Card>
            <Statistic 
              title="Active Exhibitions" 
              value={stats.activeExhibitions} 
              prefix={<EnvironmentOutlined />} 
            />
          </Card>
          <Card>
            <Statistic 
              title="Pending Approval" 
              value={stats.pendingApproval} 
              prefix={<PlusOutlined />} 
            />
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
              onClick={() => router.push('/exhibitions/create')}
            >
              Create New Exhibition
            </Button>
            <Button 
              onClick={() => router.push('/profile/edit')}
            >
              Edit Profile
            </Button>
          </div>
        </div>
        
        {/* Tabs for different views */}
        <Card className="mt-6">
          <Tabs defaultActiveKey="exhibitions">
            <TabPane tab="My Exhibitions" key="exhibitions">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Spin size="large" />
                </div>
              ) : (
                <ExhibitionGrid 
                  exhibitions={exhibitions} 
                  columns={3}
                  showCurator={false}
                  emptyText="You haven't created any exhibitions yet"
                />
              )}
            </TabPane>
            
            <TabPane tab="Pending Approvals" key="pending">
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
            </TabPane>
            
            <TabPane tab="Active Exhibitions" key="active">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Spin size="large" />
                </div>
              ) : (
                <ExhibitionGrid 
                  exhibitions={exhibitions.filter(ex => ex.isActive)} 
                  columns={3}
                  showCurator={false}
                  emptyText="You don't have any active exhibitions"
                />
              )}
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default CuratorDashboard;