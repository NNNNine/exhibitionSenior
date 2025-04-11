// frontend/src/app/curator/layout/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { DndProvider, TouchTransition, MouseTransition } from 'react-dnd-multi-backend'
import { 
  Layout, 
  Typography, 
  Button, 
  Spin, 
  Card, 
  Tabs, 
  Modal, 
  Form, 
  Input, 
  message, 
  Divider, 
  Alert 
} from 'antd';
import { PlusOutlined, SaveOutlined, UndoOutlined, ExportOutlined } from '@ant-design/icons';
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
  getArtworksForPlacement 
} from '@/lib/api/exhibition';

import WallComponent from '@/components/exhibition/Wall';
import WallLayout from '@/components/exhibition/WallLayout';
import DraggableArtworkComponent from '@/components/exhibition/DraggableArtwork';

const { Title, Text } = Typography;
const { Content, Sider } = Layout;
const { TabPane } = Tabs;

// Choose the right backend based on device
const DndBackend = {
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
  
  // Find the selected wall
  const selectedWall = walls.find(wall => wall.id === selectedWallId);
  
  // Get list of placed artwork IDs
  const placedArtworkIds = walls.flatMap(wall => 
    wall.placements.map(placement => placement.artworkId)
  );
  
  // Filter stockpile to only show artworks that aren't already placed
  const availableArtworks = stockpile.filter(
    artwork => !placedArtworkIds.includes(artwork.id)
  ).map(artwork => ({
    ...artwork,
    type: 'ARTWORK' as const
  }));

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
  }, [loadData]);
  
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
        message.success('Wall updated successfully');
      } else {
        // Create new wall
        await createWall(values);
        message.success('Wall created successfully');
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
      message.success('Wall deleted successfully');
      
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
    const existingPlacement = wall.placements.find(p => p.position === position);
    if (existingPlacement) {
      message.error('This position is already occupied');
      return;
    }
    
    // Find the artwork
    const artwork = stockpile.find(a => a.id === artworkId);
    if (!artwork) return;
    
    // Create the placement data
    const layoutData: WallLayoutData = {
      placements: [
        ...wall.placements.map(p => ({
          artworkId: p.artworkId,
          position: p.position,
          coordinates: p.coordinates,
          rotation: p.rotation,
          scale: p.scale
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
      message.success('Artwork placed successfully');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Failed to place artwork');
    }
  };
  
  // Handle artwork removal
  const handleArtworkRemove = async (placementId: string) => {
    if (!selectedWall) return;
    
    // Filter out the removed placement
    const updatedPlacements = selectedWall.placements
      .filter(p => p.id !== placementId)
      .map(p => ({
        artworkId: p.artworkId,
        position: p.position,
        coordinates: p.coordinates,
        rotation: p.rotation,
        scale: p.scale
      }));
    
    // Create the updated layout data
    const layoutData: WallLayoutData = {
      placements: updatedPlacements
    };
    
    try {
      // Update the wall layout
      await updateWallLayout(selectedWall.id, layoutData);
      message.success('Artwork removed successfully');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Failed to remove artwork');
    }
  };
  
  // Handle layout save to Unity
  const handleSaveLayout = async () => {
    message.success('Layout saved and ready for the 3D exhibition');
    // This is where we would trigger the update to the Unity scene
    // In a real implementation, this might call an API endpoint or use WebSockets
  };
  
  // Handle layout reset
  const handleResetLayout = async () => {
    if (!selectedWall) return;
    
    Modal.confirm({
      title: 'Reset Layout',
      content: 'Are you sure you want to remove all artworks from this wall?',
      onOk: async () => {
        try {
          // Update with empty placements
          await updateWallLayout(selectedWall.id, { placements: [] });
          message.success('Layout reset successfully');
          loadData();
        } catch (err: any) {
          message.error(err.message || 'Failed to reset layout');
        }
      }
    });
  };

  return (
    <DndProvider options={DndBackend}>
      <Layout className="min-h-screen">
        <Layout>
          <Sider 
            width={320} 
            className="bg-white p-4 overflow-auto" 
            style={{ height: '100vh' }}
          >
            <div className="flex justify-between items-center mb-4">
              <Title level={4} className="my-0">Art Stockpile</Title>
              <Text type="secondary">
                {availableArtworks.length} available
              </Text>
            </div>
            
            <Divider className="my-2" />
            
            {/* Art stockpile */}
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              {availableArtworks.map(artwork => (
                <DraggableArtworkComponent 
                  key={artwork.id} 
                  artwork={artwork} 
                />
              ))}
              
              {availableArtworks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No available artworks in stockpile
                </div>
              )}
            </div>
          </Sider>
          
          <Content className="p-6 overflow-auto">
            <div className="mb-6 flex justify-between items-center">
              <Title level={2}>Exhibition Layout Editor</Title>
              
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={handleSaveLayout}
                disabled={walls.length === 0}
              >
                Save Exhibition Layout
              </Button>
            </div>
            
            {error && (
              <Alert 
                message="Error" 
                description={error} 
                type="error" 
                showIcon 
                className="mb-4" 
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
                      No walls created yet. Add a wall to get started.
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
                      
                      <Button 
                        icon={<UndoOutlined />} 
                        onClick={handleResetLayout}
                        danger
                      >
                        Reset Layout
                      </Button>
                    </div>
                    
                    <WallLayout 
                      wall={selectedWall}
                      onArtworkPlace={handleArtworkPlace}
                      onArtworkRemove={handleArtworkRemove}
                    />
                    
                    <Divider />
                    
                    <div className="bg-gray-100 p-4 rounded">
                      <Title level={5}>Instructions</Title>
                      <Text>
                        Drag artworks from the stockpile on the left and drop them onto the wall positions.
                        Each wall has three positions: Left, Center, and Right.
                        You can remove an artwork by clicking the X button.
                      </Text>
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <div className="text-center py-12 px-4">
                      <Title level={4} className="text-gray-500">No Wall Selected</Title>
                      <Text className="text-gray-400 block mb-6">
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
    </DndProvider>
  );
};

export default withProtectedRoute(CuratorLayoutEditor, {
    requiredRoles: [UserRole.CURATOR, UserRole.ADMIN],
    redirectTo: '/unauthorized',
});