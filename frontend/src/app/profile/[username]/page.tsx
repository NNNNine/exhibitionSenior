'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  Button, 
  Avatar, 
  Tabs, 
  Tag, 
  Spin, 
  Alert, 
  message, 
  Statistic, 
  Divider, 
  Typography, 
  Skeleton,
  Empty,
  Space 
} from 'antd';
import { 
  UserOutlined, 
  EnvironmentOutlined, 
  PictureOutlined, 
  EditOutlined, 
  MailOutlined, 
  CalendarOutlined,
  HeartOutlined,
  EyeOutlined,
  TrophyOutlined,
  ShareAltOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { getUserByUsername, getUserArtworks, getExhibition } from '@/lib/api/index';
import { User, UserRole } from '@/types/user.types';
import { Artwork } from '@/types/artwork.types';
import { Exhibition } from '@/types/exhibition.types';
import ArtworkGrid from '@/components/artwork/ArtworkGrid';
// import ExhibitionGrid from '@/components/exhibition/ExhibitionGrid';
import { formatDate, formatImageUrl } from '@/utils/format';
// import { set } from 'date-fns';

const { Title, Paragraph, Text } = Typography;

const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthContext();
  
  const [user, setUser] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('1');

  // Fetch user data and related content
  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;
      
      setLoading(true);
      try {
        // Get user profile
        const userData = await getUserByUsername(username as string);
        setUser(userData);

        // Fetch content based on user role
        await Promise.all([
          // If user is an artist, get their artworks
          userData.role === UserRole.ARTIST && getUserArtworks(userData.id)
            .then(({ artworks: fetchedArtworks }) => setArtworks(fetchedArtworks)),
          
          // If user is a curator, get their exhibitions
          userData.role === UserRole.CURATOR && getExhibition()
            .then(({ exhibition: fetchedExhibition }) => setExhibitions(fetchedExhibition))
        ]);

      } catch (err: any) {
        console.error("Error fetching profile data:", err);
        setError(err.message || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  const handleShareProfile = () => {
    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        message.success('Profile link copied to clipboard!');
      })
      .catch(() => {
        message.error('Failed to copy profile link');
      });
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const isCurrentUser = currentUser && currentUser.id === user?.id;

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.CURATOR:
        return 'green';
      case UserRole.ARTIST:
        return 'blue';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <Card className="text-center">
              <div className="flex flex-col items-center">
                <Skeleton.Avatar active size={96} className="mb-4" />
                <Skeleton.Input active size="small" className="mb-2" />
                <Skeleton.Button active size="small" className="mb-4" />
              </div>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          </div>
          
          {/* Content Area Skeleton */}
          <div className="lg:col-span-3">
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          </div>
        </div>
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
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Typography.Title level={4}>
                User not found
              </Typography.Title>
            }
          >
            <Paragraph className="text-gray-500 mb-6">
              The user profile you&apos;re looking for doesn&apos;t exist or may have been removed.
            </Paragraph>
            <Button 
              type="primary"
              onClick={() => router.push('/artworks')} 
            >
              Explore Artworks
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  // Format the joined date
  const joinedDate = formatDate(user.createdAt, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate bio based on user role
  const generateBio = () => {
    switch (user.role) {
      case UserRole.ARTIST:
        return (
          <Paragraph>
            This artist has joined our platform to showcase their amazing artwork. 
            Their unique style and creative vision brings a fresh perspective to our community.
            Explore their portfolio to discover their artistic journey and creative process.
          </Paragraph>
        );
      case UserRole.CURATOR:
        return (
          <Paragraph>
            As a curator on our platform, {user.username} is passionate about organizing 
            and presenting art exhibitions. With a keen eye for detail and composition,
            they curate experiences that engage and inspire visitors. Check out their
            curated collections and exhibitions to experience their vision.
          </Paragraph>
        );
      case UserRole.VISITOR:
        return (
          <Paragraph>
            {user.username} enjoys exploring art exhibitions and discovering new artists 
            on our platform. As an art enthusiast, they&apos;re constantly looking for inspiration
            and connecting with creative works that resonate with them.
          </Paragraph>
        );
      default:
        return <Paragraph>Welcome to {user.username}&apos;s profile!</Paragraph>;
    }
  };

  // Prepare tabs based on user role
  const getTabItems = () => {
    const tabs = [
      {
        key: '1',
        label: 'About',
        children: (
          <div className="py-2">
            <Title level={4}>About {user.username}</Title>
            {generateBio()}
            
            <Divider />
          </div>
        )
      }
    ];

    // Add role-specific tabs
    if (user.role === UserRole.ARTIST) {
      tabs.push({
        key: '2',
        label: 'Artworks',
        children: (
          <div className="py-2">
            <div className="flex justify-between items-center mb-6">
              <Title level={4}>Artworks by {user.username}</Title>
              <div>
                {isCurrentUser && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => router.push('/artworks/upload')}
                  >
                    Upload New Artwork
                  </Button>
                )}
              </div>
            </div>
            
            {artworks.length > 0 ? (
              <ArtworkGrid 
                artworks={artworks} 
                columns={3}
              />
            ) : (
              <Empty
                image={<PictureOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                description={
                  isCurrentUser 
                    ? "You haven't uploaded any artworks yet" 
                    : "This artist hasn't uploaded any artworks yet"
                }
              >
                {isCurrentUser && (
                  <Button 
                    type="primary"
                    onClick={() => router.push('/artworks/upload')} 
                  >
                    Upload Your First Artwork
                  </Button>
                )}
              </Empty>
            )}
          </div>
        )
      });
    } else if (user.role === UserRole.CURATOR) {
      tabs.push({
        key: '2',
        label: 'Exhibitions',
        children: (
          <div className="py-2">
            <div className="flex justify-between items-center mb-6">
              <Title level={4}>Exhibitions by {user.username}</Title>
              <div>
                {isCurrentUser && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => router.push('/exhibitions/create')}
                  >
                    Create New Exhibition
                  </Button>
                )}
              </div>
            </div>
            
          </div>
        )
      });
    }
    return tabs;
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card className="text-center shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="relative">
              <Avatar 
                size={96} 
                icon={<UserOutlined />} 
                src={user.profileUrl ? formatImageUrl(user.profileUrl) : undefined}
                className="mb-4 border-4 border-white shadow-md"
              />
            </div>
            
            <Title level={3} className="mb-2 mt-2">{user.username}</Title>
            <Tag color={getRoleBadgeColor(user.role)} className="mb-4">
              {user.role}
            </Tag>
            
            <div className="flex justify-center space-x-2 mb-4">
              <Button 
                type="text" 
                icon={<ShareAltOutlined />}
                onClick={handleShareProfile}
                size="small"
              />
              {isCurrentUser && (
                <Button 
                  type="text" 
                  icon={<EditOutlined />}
                  onClick={() => router.push('/profile/edit')}
                  size="small"
                />
              )}
            </div>
            
            <Divider className="my-3" />
            
            <div className="text-left">
              <div className="flex items-center mb-3">
                <MailOutlined className="mr-2 text-gray-500" />
                <Text>{user.email}</Text>
              </div>
              <div className="flex items-center mb-3">
                <CalendarOutlined className="mr-2 text-gray-500" />
                <Text>Joined {joinedDate}</Text>
              </div>
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
          <Card className="mt-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <Title level={4} className="mb-4">Statistics</Title>
            
            <div className="grid grid-cols-2 gap-4">
              {user.role === UserRole.ARTIST && (
                <>
                  <Statistic 
                    title="Artworks" 
                    value={artworks.length} 
                    prefix={<PictureOutlined className="text-blue-500" />} 
                  />
                  <Statistic 
                    title="In Exhibitions" 
                    value={artworks.filter(a => a.exhibitionItems && a.exhibitionItems.length > 0).length} 
                    prefix={<EnvironmentOutlined className="text-green-500" />} 
                  />
                  <Statistic 
                    title="Views" 
                    value={2467} 
                    prefix={<EyeOutlined className="text-purple-500" />} 
                  />
                  <Statistic 
                    title="Likes" 
                    value={158} 
                    prefix={<HeartOutlined className="text-red-500" />} 
                  />
                </>
              )}
              
              {user.role === UserRole.CURATOR && (
                <>
                  <Statistic 
                    title="Artworks" 
                    value={exhibitions?.items?.length || 0} 
                    prefix={<PictureOutlined className="text-blue-500" />} 
                  />
                  <Statistic 
                    title="Views" 
                    value={3241} 
                    prefix={<EyeOutlined className="text-purple-500" />} 
                  />
                </>
              )}
              
              {user.role === UserRole.VISITOR && (
                <>
                  <Statistic 
                    title="Exhibitions Visited" 
                    value={15} 
                    prefix={<EnvironmentOutlined className="text-green-500" />} 
                  />
                  <Statistic 
                    title="Liked Artworks" 
                    value={27} 
                    prefix={<HeartOutlined className="text-red-500" />} 
                  />
                </>
              )}
            </div>
          </Card>
        </div>
        
        {/* Content Area */}
        <div className="lg:col-span-3">
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <Tabs 
              activeKey={activeTab}
              onChange={handleTabChange}
              items={getTabItems()}
              size="large"
              className="profile-tabs"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;