'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Avatar, Tabs, Tag, Spin, Alert, message, Statistic } from 'antd';
import { UserOutlined, EnvironmentOutlined, PictureOutlined, EditOutlined, MailOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { getUserByUsername, getUserArtworks, getExhibitions } from '@/lib/api/index';
import { User, UserRole } from '@/types/user.types';
import { Artwork } from '@/types/artwork.types';
import { Exhibition } from '@/types/exhibition.types';
import ArtworkGrid from '@/components/artwork/ArtworkGrid';
import ExhibitionGrid from '@/components/exhibition/ExhibitionGrid';
import { formatDate } from '@/utils/format';

const { TabPane } = Tabs;

const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthContext();
  
  const [user, setUser] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data and related content
  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;
      
      setLoading(true);
      try {
        // Get user profile
        const userData = await getUserByUsername(username as string);
        setUser(userData);

        // If user is an artist, get their artworks
        if (userData.role === UserRole.ARTIST) {
          const { artworks: fetchedArtworks } = await getUserArtworks(userData.id);
          setArtworks(fetchedArtworks);
        }

        // If user is a curator, get their exhibitions
        if (userData.role === UserRole.CURATOR) {
          const { exhibitions: fetchedExhibitions } = await getExhibitions({
            curator: userData.id,
          });
          setExhibitions(fetchedExhibitions);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert
          message="Error Loading Profile"
          description={error}
          type="error"
          showIcon
        />
        <Button 
          onClick={() => router.back()} 
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert
          message="User Not Found"
          description="The user you are looking for could not be found."
          type="warning"
          showIcon
        />
        <Button 
          onClick={() => router.push('/')} 
          className="mt-4"
        >
          Go to Home
        </Button>
      </div>
    );
  }

  const isCurrentUser = currentUser && currentUser.id === user.id;

  // Format the joined date
  const joinedDate = formatDate(user.createdAt, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <Avatar 
              size={96} 
              icon={<UserOutlined />} 
              src={user.profileUrl}
              className="mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
            <Tag color={
              user.role === UserRole.ADMIN ? 'red' : 
              user.role === UserRole.CURATOR ? 'green' : 
              user.role === UserRole.ARTIST ? 'blue' : 
              'default'
            }>
              {user.role}
            </Tag>
            
            <div className="mt-4 text-left">
              <p className="flex items-center mb-2">
                <MailOutlined className="mr-2" />
                {user.email}
              </p>
              <p className="flex items-center">
                <CalendarOutlined className="mr-2" />
                Joined {joinedDate}
              </p>
            </div>
            
            {isCurrentUser && (
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                className="mt-4 w-full"
                onClick={() => router.push('/profile/edit')}
              >
                Edit Profile
              </Button>
            )}
          </Card>
          
          {/* Statistics */}
          <Card className="mt-6">
            <h2 className="text-lg font-bold mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              {user.role === UserRole.ARTIST && (
                <>
                  <Statistic 
                    title="Artworks" 
                    value={artworks.length} 
                    prefix={<PictureOutlined />} 
                  />
                  <Statistic 
                    title="In Exhibitions" 
                    value={artworks.filter(a => a.exhibitionItems && a.exhibitionItems.length > 0).length} 
                    prefix={<EnvironmentOutlined />} 
                  />
                </>
              )}
              
              {user.role === UserRole.CURATOR && (
                <>
                  <Statistic 
                    title="Exhibitions" 
                    value={exhibitions.length} 
                    prefix={<EnvironmentOutlined />} 
                  />
                  <Statistic 
                    title="Active" 
                    value={exhibitions.filter(e => e.isActive).length} 
                    prefix={<EnvironmentOutlined />} 
                  />
                </>
              )}
            </div>
          </Card>
        </div>
        
        {/* Content Area */}
        <div className="lg:col-span-3">
          <Card>
            <Tabs defaultActiveKey="1">
              {/* About Tab */}
              <TabPane tab="About" key="1">
                <h2 className="text-xl font-bold mb-4">About {user.username}</h2>
                <p>
                  {/* Mock user bio - in a real app this would come from the user data */}
                  {user.role === UserRole.ARTIST && (
                    <>
                      This artist has joined our platform to showcase their amazing artwork. 
                      Explore their portfolio to discover their unique style and creativity.
                    </>
                  )}
                  
                  {user.role === UserRole.CURATOR && (
                    <>
                      As a curator on our platform, this user is passionate about organizing 
                      and presenting art exhibitions. Check out their curated collections and exhibitions.
                    </>
                  )}
                  
                  {user.role === UserRole.VISITOR && (
                    <>
                      This user enjoys exploring art exhibitions and discovering new artists 
                      on our platform. They're an art enthusiast looking for inspiration.
                    </>
                  )}
                </p>
              </TabPane>
              
              {/* Artworks Tab (for Artists) */}
              {user.role === UserRole.ARTIST && (
                <TabPane tab="Artworks" key="2">
                  <h2 className="text-xl font-bold mb-4">Artworks by {user.username}</h2>
                  {artworks.length > 0 ? (
                    <ArtworkGrid 
                      artworks={artworks} 
                      columns={3}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <PictureOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                      <p className="mt-4 text-gray-500">This artist hasn't uploaded any artworks yet.</p>
                    </div>
                  )}
                </TabPane>
              )}
              
              {/* Exhibitions Tab (for Curators) */}
              {user.role === UserRole.CURATOR && (
                <TabPane tab="Exhibitions" key="2">
                  <h2 className="text-xl font-bold mb-4">Exhibitions by {user.username}</h2>
                  {exhibitions.length > 0 ? (
                    <ExhibitionGrid 
                      exhibitions={exhibitions} 
                      columns={2}
                      showCurator={false}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <EnvironmentOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                      <p className="mt-4 text-gray-500">This curator hasn't created any exhibitions yet.</p>
                    </div>
                  )}
                </TabPane>
              )}
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;