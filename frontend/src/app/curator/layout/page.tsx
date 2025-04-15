// frontend/src/app/curator/layout/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider, TouchTransition, MouseTransition } from 'react-dnd-multi-backend';
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
// import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import { 
  Layout, 
  Typography, 
  Button, 
  Spin, 
  Card, 
  Modal, 
  Form, 
  Input, 
  message, 
  Divider, 
  Alert,
  Empty,
  Space,
  Tooltip,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  SaveOutlined, 
  UndoOutlined, 
  ExportOutlined, 
  InfoCircleOutlined, 
  SearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { withProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import { 
  Wall, 
  WallData, 
  PlacementPosition, 
  WallLayoutData,
  DraggableArtwork
} from '@/types/exhibition.types';
import { Artwork } from '@/types/artwork.types';

import { 
  getWalls, 
  createWall, 
  updateWall, 
  deleteWall, 
  updateWallLayout,
  getArtworksForPlacement,
  saveExhibitionLayout
} from '@/lib/api/exhibition';

import WallComponent from '@/components/exhibition/Wall';
import WallLayout from '@/components/exhibition/WallLayout';
import DraggableArtworkComponent from '@/components/exhibition/DraggableArtwork';

const { Title, Text, Paragraph } = Typography;
const { Content, Sider } = Layout;

// HTML5toTouch is a custom preset that enables drag & drop on both desktop and mobile
export const dndOptions = {
  backends: [
    {
      id: 'html5',
      backend: HTML5Backend,
      transition: MouseTransition,
    },
    {
      id: 'touch',
      backend: TouchBackend,
      options: {enableMouseEvents: true},
      preview: true,
      transition: TouchTransition,
    },
  ],
}

const CuratorLayoutEditor: React.FC = () => {
  // State
  const [walls, setWalls] = useState<Wall[]>([]);
  const [stockpile, setStockpile] = useState<Artwork[]>([]);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingLayout, setSavingLayout] = useState<boolean>(false);
  const [wallFormVisible, setWallFormVisible] = useState<boolean>(false);
  const [editingWall, setEditingWall] = useState<Wall | null>(null);
  const [wallForm] = Form.useForm();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [confirmResetVisible, setConfirmResetVisible] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Find the selected wall
  const selectedWall = walls.find(wall => wall.id === selectedWallId);
  
  // Get list of placed artwork IDs
  const placedArtworkIds = walls.flatMap(wall => 
    wall.placements.map(placement => placement.artworkId)
  );
  
  // Filter stockpile to only show artworks that aren't already placed
  // and filter by search text if provided
  const availableArtworks = useMemo(() => {
    return stockpile
      .filter(artwork => !placedArtworkIds.includes(artwork.id))
      .filter(artwork => 
        searchText ? 
          artwork.title.toLowerCase().includes(searchText.toLowerCase()) || 
          artwork.artist?.username?.toLowerCase().includes(searchText.toLowerCase()) || 
          artwork.category.toLowerCase().includes(searchText.toLowerCase())
          : true
      )
      .map(artwork => ({
        ...artwork,
        type: 'ARTWORK' as const
      }));
  }, [stockpile, placedArtworkIds, searchText]);

  // Load walls and stockpile data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load walls
      const wallsData = await getWalls();
      setWalls(wallsData);
      
      // Set the first wall as selected if none is selected
      if (wallsData.length > 0 && !selectedWallId) {
        setSelectedWallId(wallsData[0].id);
      }
      
      // Load stockpile (approved artworks)
      const artworksData = await getArtworksForPlacement();
      setStockpile(artworksData);
    } catch (err: any) {
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [selectedWallId]);
  
  // Load data on component mount
  useEffect(() => {
    loadData();
    console.log('stockpile', stockpile);
    console.log('availableArtworks', availableArtworks);
  }, [loadData]);
  
  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  // Handle wall selection
  const handleWallSelect = (wallId: string) => {
    setSelectedWallId(wallId);
  };
  
  // Handle wall creation
  const handleWallCreate = async () => {
    try {
      await wallForm.validateFields();
      const values = wallForm.getFieldsValue();
      
      if (editingWall) {
        // Update existing wall
        await updateWall(editingWall.id, values);
        setSuccessMessage('Wall updated successfully');
      } else {
        // Create new wall
        await createWall(values);
        setSuccessMessage('Wall created successfully');
      }
      
      // Reset form and refresh data
      wallForm.resetFields();
      setWallFormVisible(false);
      setEditingWall(null);
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Failed to save wall');
    }
  };
  
  // Handle wall deletion
  const handleWallDelete = async (wallId: string) => {
    try {
      await deleteWall(wallId);
      setSuccessMessage('Wall deleted successfully');
      
      // If the deleted wall was selected, select the first available wall
      if (selectedWallId === wallId) {
        const remainingWalls = walls.filter(w => w.id !== wallId);
        if (remainingWalls.length > 0) {
          setSelectedWallId(remainingWalls[0].id);
        } else {
          setSelectedWallId(null);
        }
      }
      
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Failed to delete wall');
    }
  };
  
  // Handle wall edit button click
  const handleWallEdit = (wall: Wall) => {
    setEditingWall(wall);
    wallForm.setFieldsValue({
      name: wall.name,
      displayOrder: wall.displayOrder
    });
    setWallFormVisible(true);
  };
  
  // Handle artwork placement
  const handleArtworkPlace = async (artworkId: string, position: PlacementPosition, wallId: string) => {
    // Find the wall and update its placements
    const wall = walls.find(w => w.id === wallId);
    if (!wall) return;
    
    // Check if position is already taken
    const existingPlacement = wall.placements?.find(p => p.position === position);
    if (existingPlacement) {
      message.error('This position is already occupied');
      return;
    }
    
    // Find the artwork
    const artwork = stockpile.find(a => a.id === artworkId);
    if (!artwork) return;
    
    setSavingLayout(true);
    
    // Create the placement data
    const layoutData: WallLayoutData = {
      placements: [
        ...wall.placements.map(p => ({
          artworkId: p.artworkId,
          position: p.position,
          ...(p.coordinates && { coordinates: p.coordinates }),
          ...(p.rotation && { rotation: p.rotation }),
          ...(p.scale && { scale: p.scale })
        })),
        {
          artworkId,
          position
        }
      ]
    };
    
    try {
      // Update the wall layout
      await updateWallLayout(wallId, layoutData);
      setSuccessMessage('Artwork placed successfully');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Failed to place artwork');
    } finally {
      setSavingLayout(false);
    }
  };
  
  // Handle artwork removal
  const handleArtworkRemove = async (placementId: string) => {
    if (!selectedWall) return;
    
    setSavingLayout(true);
    
    // Filter out the removed placement
    const updatedPlacements = selectedWall.placements
      .filter(p => p.id !== placementId)
      .map(p => ({
        artworkId: p.artworkId,
        position: p.position,
        ...(p.coordinates && { coordinates: p.coordinates }),
        ...(p.rotation && { rotation: p.rotation }),
        ...(p.scale && { scale: p.scale })
      }));
    
    // Create the updated layout data
    const layoutData: WallLayoutData = {
      placements: updatedPlacements
    };
    
    try {
      // Update the wall layout
      await updateWallLayout(selectedWall.id, layoutData);
      setSuccessMessage('Artwork removed successfully');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Failed to remove artwork');
    } finally {
      setSavingLayout(false);
    }
  };
  
  // Handle layout save to Unity
  const handleSaveLayout = async () => {
    try {
      setSavingLayout(true);
      
      // Call API to save the exhibition layout for Unity
      const result = await saveExhibitionLayout();
      
      message.success('Layout saved and ready for the 3D exhibition');
      setSuccessMessage(result.message || 'Layout successfully pushed to 3D exhibition');
    } catch (error: any) {
      message.error(error.message || 'Failed to save layout to 3D exhibition');
      setError(error.message || 'Failed to save layout. Please try again.');
    } finally {
      setSavingLayout(false);
    }
  };
  
  // Handle layout reset
  const handleResetLayout = async () => {
    if (!selectedWall) return;
    
    setConfirmResetVisible(false);
    setSavingLayout(true);
    
    try {
      // Update with empty placements
      await updateWallLayout(selectedWall.id, { placements: [] });
      setSuccessMessage('Layout reset successfully');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Failed to reset layout');
    } finally {
      setSavingLayout(false);
    }
  };

  return (
    <DndProvider options={dndOptions}>
      <Layout style={{ minHeight: '100vh' }}>
        <Layout>
          {/* Stockpile Sidebar */}
          <Sider 
            width={320}
            style={{ height: '100vh', position: 'sticky', left: 0, top: 0, bottom: 0, backgroundColor: 'white', overflow: 'auto' }}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <Title level={4} style={{ marginTop: '0rem', marginBottom: '0rem' }}>Art Stockpile</Title>
                <Badge count={availableArtworks.length} overflowCount={999} />
              </div>
              
              <div className="mb-4">
                <Input 
                  placeholder="Search artworks..." 
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </div>
              
              <Paragraph style={{ color: '#6b7280' }}>
                {availableArtworks.length} approved {availableArtworks.length === 1 ? 'artwork' : 'artworks'} available for placement
              </Paragraph>
            </div>
            
            {/* Art stockpile list */}
            <div className="overflow-auto p-4" style={{ height: 'calc(100vh - 160px)' }}>
              {availableArtworks.length > 0 ? (
                <>
                  {isDragging && (
                    <Alert
                      message="Drag to empty slots"
                      type="info"
                      showIcon
                      style={{ marginBottom: '1rem', position: 'sticky', top: 0, zIndex: 10 }}
                    />
                  )}
                  
                  {availableArtworks.map(artwork => (
                    <DraggableArtworkComponent 
                      key={artwork.id} 
                      artwork={artwork}
                      onDragStart={() => setIsDragging(true)}
                      onDragEnd={() => setIsDragging(false)}
                    />
                  ))}
                </>
              ) : (
                <Empty
                  description={
                    searchText
                      ? "No matching artworks found"
                      : "No available artworks in stockpile"
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </Sider>
          
          {/* Main Content */}
          <Content style={{ padding: '1.5rem', marginLeft: '1.5rem' }}>
            <div className="mb-6 flex justify-between items-center">
              <Title level={2}>Exhibition Layout Editor</Title>
              
              <Space>
                {/* <Tooltip title="Save layout to 3D exhibition">
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />}
                    onClick={handleSaveLayout}
                    disabled={walls.length === 0}
                    loading={savingLayout}
                  >
                    Save Exhibition Layout
                  </Button>
                </Tooltip> */}
              </Space>
            </div>
            
            {/* Success/error messages */}
            {error && (
              <Alert 
                message="Error" 
                description={error} 
                type="error" 
                showIcon 
                style={{ marginBottom: '1rem' }}
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
                style={{ marginBottom: '1rem' }}
                closable
                onClose={() => setSuccessMessage(null)}
              />
            )}
            
            <div className="flex flex-wrap md:flex-nowrap gap-6">
              {/* Walls list */}
              <div className="w-full md:w-1/3">
                <Card 
                  title="Exhibition Walls" 
                  extra={
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      size="small"
                      onClick={() => {
                        setEditingWall(null);
                        wallForm.resetFields();
                        setWallFormVisible(true);
                      }}
                    >
                      Add Wall
                    </Button>
                  }
                >
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Spin />
                    </div>
                  ) : walls.length > 0 ? (
                    <div>
                      {walls.map(wall => (
                        <WallComponent 
                          key={wall.id}
                          wall={wall}
                          selected={wall.id === selectedWallId}
                          onClick={handleWallSelect}
                          onEdit={handleWallEdit}
                          onDelete={handleWallDelete}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="mb-4">
                        <PlusOutlined style={{ fontSize: 24 }} />
                      </div>
                      <p>No walls created yet.</p>
                      <p>Add a wall to get started.</p>
                    </div>
                  )}
                </Card>
              </div>
              
              {/* Wall layout */}
              <div className="w-full md:w-2/3">
                {selectedWall ? (
                  <Card>
                    <div className="flex justify-between items-center mb-4">
                      <Title level={3}>Wall Layout: {selectedWall.name}</Title>
                      
                      <Tooltip title="Reset wall and remove all artworks">
                        <Button 
                          icon={<UndoOutlined />} 
                          onClick={() => setConfirmResetVisible(true)}
                          danger
                        >
                          Reset Layout
                        </Button>
                      </Tooltip>
                    </div>
                    
                    <WallLayout 
                      wall={selectedWall}
                      onArtworkPlace={handleArtworkPlace}
                      onArtworkRemove={handleArtworkRemove}
                    />
                  </Card>
                ) : (
                  <Card>
                    <div className="text-center py-12 px-4">
                      <Title level={4} style={{ color: '#6b7280' }}>No Wall Selected</Title>
                      <Text style={{ display: 'block', marginBottom: '1.5rem', color: '#9ca3af' }}>
                        Select a wall from the list or create a new wall to start arranging artworks.
                      </Text>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setEditingWall(null);
                          wallForm.resetFields();
                          setWallFormVisible(true);
                        }}
                      >
                        Create New Wall
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
            
            {/* Help information */}
            <Card style={{ backgroundColor: '#eef2ff', marginTop: '1.5rem' }}>
              <div className="flex">
                <InfoCircleOutlined style={{ color: '#6366f1', fontSize: '1.125rem', marginRight: '0.75rem', marginBottom: '9.5rem' }} />
                <div>
                  <Title level={5}>How to Use the Layout Editor</Title>
                  <Paragraph>
                    1. <strong>Create Walls:</strong> Add walls that will be part of your exhibition.
                  </Paragraph>
                  <Paragraph>
                    2. <strong>Arrange Artwork:</strong> Drag artwork from the stockpile on the left and drop it onto the wall's left, center, or right position.
                  </Paragraph>
                  <Paragraph>
                    3. <strong>Save Layout:</strong> Once you've arranged all your artwork, click the "Save Exhibition Layout" button to push the changes to the 3D exhibition.
                  </Paragraph>
                  <Paragraph>
                    <strong>Note:</strong> Only approved artwork appears in the stockpile. To approve more artwork, visit the Curator Dashboard.
                  </Paragraph>
                </div>
              </div>
            </Card>
          </Content>
        </Layout>
      </Layout>
      
      {/* Wall Create/Edit Modal */}
      <Modal
        title={editingWall ? "Edit Wall" : "Create New Wall"}
        open={wallFormVisible}
        onCancel={() => setWallFormVisible(false)}
        onOk={handleWallCreate}
        okText={editingWall ? "Update" : "Create"}
        confirmLoading={savingLayout}
      >
        <Form 
          form={wallForm} 
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Wall Name"
            rules={[{ required: true, message: 'Please enter a name for this wall' }]}
          >
            <Input placeholder="e.g. North Wall, Gallery Entrance" />
          </Form.Item>
          
          <Form.Item
            name="displayOrder"
            label="Display Order"
            rules={[{ required: true, message: 'Please enter a display order' }]}
            help="Lower numbers appear first in the sequence"
          >
            <Input type="number" min={1} placeholder="e.g. 1, 2, 3" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Confirm Reset Modal */}
      <Modal
        title="Reset Wall Layout"
        open={confirmResetVisible}
        onCancel={() => setConfirmResetVisible(false)}
        onOk={handleResetLayout}
        okText="Reset"
        okButtonProps={{ danger: true }}
        confirmLoading={savingLayout}
      >
        <div className="py-2">
          <ExclamationCircleOutlined style={{ color: '#f59e0b', fontSize: '1.25rem', marginRight: '0.5rem'}} />
          <span>
            Are you sure you want to remove all artworks from this wall? This action cannot be undone.
          </span>
        </div>
      </Modal>
    </DndProvider>
  );
};

export default withProtectedRoute(CuratorLayoutEditor, {
    requiredRoles: [UserRole.CURATOR],
    redirectTo: '/unauthorized',
});