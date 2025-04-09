'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Statistic, Empty, message, Spin } from 'antd';
import { PictureOutlined, UploadOutlined, CommentOutlined, StarOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import { getArtworks } from '@/lib/api/index';
import ArtworkGrid from '@/components/artwork/ArtworkGrid';
import { Artwork } from '@/types/artwork.types';

const ArtistDashboard: React.FC = () => {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalArtworks: 0,
    pendingApproval: 0,
    exhibitionsFeatureIn: 0,
    totalViews: 0,
    totalLikes: 0,
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

        // Separate pending artworks (this is mock data - in real app we'd have a status field)
        const pending = fetchedArtworks.filter(art => 
          !art.exhibitionItems || art.exhibitionItems.length === 0
        );

        setArtworks(fetchedArtworks);
        setPendingArtworks(pending);
        
        // Calculate statistics
        setStats({
          totalArtworks: fetchedArtworks.length,
          pendingApproval: pending.length,
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
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Artist Dashboard</h1>
      
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
            title="Pending Approval" 
            value={stats.pendingApproval} 
            prefix={<UploadOutlined />} 
          />
        </Card>
        <Card>
          <Statistic 
            title="Total Views" 
            value={stats.totalViews} 
            prefix={<CommentOutlined />} 
          />
        </Card>
        <Card>
          <Statistic 
            title="Total Likes" 
            value={stats.totalLikes} 
            prefix={<StarOutlined />} 
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
      <Card className="mt-6">
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
              label: 'Pending Approval',
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
              key: 'exhibitions',
              label: 'Featured in Exhibitions',
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
                    emptyText="None of your artworks are featured in exhibitions yet"
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