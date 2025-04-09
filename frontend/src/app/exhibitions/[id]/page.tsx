'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  Button, 
  Tag, 
  Divider, 
  Spin, 
  Alert, 
  Descriptions, 
  Tabs, 
  List,
  Modal,
  message
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EnvironmentOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined
} from '@ant-design/icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { getExhibitionById, deleteExhibition } from '@/lib/api/index';
import { Exhibition } from '@/types/exhibition.types';
import { Artwork } from '@/types/artwork.types';
import { formatDate, formatImageUrl } from '@/utils/format';
import { UserRole } from '@/types/user.types';
import ArtworkGrid from '@/components/artwork/ArtworkGrid';
import UnityViewer from '@/components/metaverse/UnityViewer';

const { TabPane } = Tabs;

const ExhibitionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    const fetchExhibition = async () => {
      setLoading(true);
      try {
        const exhibitionData = await getExhibitionById(id as string);
        setExhibition(exhibitionData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExhibition();
    }
  }, [id]);

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Delete Exhibition',
      content: 'Are you sure you want to delete this exhibition? This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteExhibition(id as string);
          message.success('Exhibition deleted successfully');
          router.push('/exhibitions');
        } catch (err: any) {
          message.error(err.message || 'Failed to delete exhibition');
        }
      }
    });
  };

  const handleArtworkSelect = (artworkId: string) => {
    if (!exhibition || !exhibition.items) return;
    
    const foundItem = exhibition.items.find(item => item.artwork?.id === artworkId);
    if (foundItem && foundItem.artwork) {
      setSelectedArtwork(foundItem.artwork);
    }
  };

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
          message="Error Loading Exhibition"
          description={error}
          type="error"
          showIcon
        />
        <Button 
          onClick={() => router.back()} 
          className="mt-4"
          icon={<ArrowLeftOutlined />}
        >
          Go Back
        </Button>
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert
          message="Exhibition Not Found"
          description="The exhibition you are looking for could not be found."
          type="warning"
          showIcon
        />
        <Button 
          onClick={() => router.push('/exhibitions')} 
          className="mt-4"
          icon={<ArrowLeftOutlined />}
        >
          Browse All Exhibitions
        </Button>
      </div>
    );
  }

  const isCurator = user?.id === exhibition.curatorId;
  const isAdmin = user?.role === UserRole.ADMIN;
  const canEdit = isCurator || isAdmin;
  const canDelete = isCurator || isAdmin;

  // Get all artworks from exhibition items
  const artworks = exhibition.items
    ?.filter(item => item.artwork)
    .map(item => item.artwork) as Artwork[];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <Button 
          onClick={() => router.back()} 
          icon={<ArrowLeftOutlined />}
        >
          Back
        </Button>
        
        {/* Action Buttons for Curators/Admins */}
        {canEdit && (
          <div className="space-x-4">
            {canEdit && (
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => router.push(`/exhibitions/${id}/edit`)}
              >
                Edit Exhibition
              </Button>
            )}
            
            {canDelete && (
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                Delete Exhibition
              </Button>
            )}
            
            {isCurator && (
              <Button 
                icon={<PlusOutlined />}
                onClick={() => router.push(`/exhibitions/${id}/add-artwork`)}
              >
                Add Artwork
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{exhibition.title}</h1>
        <div className="mt-2 flex items-center flex-wrap gap-2">
          <Tag color={exhibition.isActive ? 'green' : 'orange'}>
            {exhibition.isActive ? 'Active' : 'Coming Soon'}
          </Tag>
          
          <div className="flex items-center">
            <CalendarOutlined className="mr-2" />
            <span>
              {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
            </span>
          </div>
          
          <div className="flex items-center ml-4">
            <UserOutlined className="mr-2" />
            <span>
              Curator: {exhibition.curator?.username || `Curator #${exhibition.curatorId}`}
            </span>
          </div>
        </div>
      </div>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Information" key="info">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <h2 className="text-xl font-bold mb-4">About This Exhibition</h2>
                <p className="whitespace-pre-line">{exhibition.description}</p>
                
                <Divider />
                
                <Descriptions layout="vertical" column={1}>
                  <Descriptions.Item label="Start Date">
                    {formatDate(exhibition.startDate, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="End Date">
                    {formatDate(exhibition.endDate, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Status">
                    {exhibition.isActive ? 'Currently Active' : 'Coming Soon'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
              
              <Card className="mt-6">
                <h2 className="text-xl font-bold mb-4">Featured Artworks</h2>
                {artworks && artworks.length > 0 ? (
                  <ArtworkGrid 
                    artworks={artworks} 
                    columns={3}
                    onArtworkClick={(artwork) => setSelectedArtwork(artwork)}
                  />
                ) : (
                  <div className="text-center py-8">
                    <EnvironmentOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                    <p className="mt-4 text-gray-500">No artworks have been added to this exhibition yet.</p>
                    {isCurator && (
                      <Button 
                        type="primary" 
                        className="mt-4"
                        icon={<PlusOutlined />}
                        onClick={() => router.push(`/exhibitions/${id}/add-artwork`)}
                      >
                        Add Artwork
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card>
                <h2 className="text-xl font-bold mb-4">Curator</h2>
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <UserOutlined style={{ fontSize: 24 }} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">
                      {exhibition.curator?.username || `Curator #${exhibition.curatorId}`}
                    </h3>
                    <Button 
                      type="link" 
                      className="p-0"
                      onClick={() => router.push(`/profile/${exhibition.curator?.username}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
                
                <Divider />
                
                <h2 className="text-xl font-bold mb-4">Artwork Details</h2>
                {selectedArtwork ? (
                  <div>
                    <img 
                      src={formatImageUrl(selectedArtwork.thumbnailUrl || selectedArtwork.fileUrl)} 
                      alt={selectedArtwork.title}
                      className="w-full h-40 object-cover mb-4"
                    />
                    <h3 className="text-lg font-semibold">{selectedArtwork.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">By {selectedArtwork.artist?.username || `Artist #${selectedArtwork.artistId}`}</p>
                    <p className="text-sm mb-4">{selectedArtwork.description}</p>
                    <Button 
                      type="primary" 
                      block
                      onClick={() => router.push(`/artworks/${selectedArtwork.id}`)}
                    >
                      View Full Details
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Select an artwork to see details</p>
                  </div>
                )}
              </Card>
              
              <Card className="mt-6">
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  icon={<EnvironmentOutlined />}
                  onClick={() => setActiveTab('3d')}
                >
                  Enter 3D Exhibition
                </Button>
              </Card>
            </div>
          </div>
        </TabPane>
        
        <TabPane tab="3D Experience" key="3d">
          <Card>
            <UnityViewer 
              exhibitionId={id as string} 
              onArtworkSelect={handleArtworkSelect}
            />
            
            {selectedArtwork && (
              <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold">{selectedArtwork.title}</h3>
                <p className="text-sm text-gray-500 mb-2">By {selectedArtwork.artist?.username || `Artist #${selectedArtwork.artistId}`}</p>
                <p className="text-sm mb-4">{selectedArtwork.description}</p>
                <Button 
                  type="primary" 
                  onClick={() => router.push(`/artworks/${selectedArtwork.id}`)}
                >
                  View Full Details
                </Button>
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ExhibitionDetailPage;