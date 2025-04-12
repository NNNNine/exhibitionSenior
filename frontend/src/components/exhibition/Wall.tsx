// frontend/src/components/exhibition/Wall.tsx
import React from 'react';
import { Card, Typography, Button, Popconfirm, Badge, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, LayoutOutlined } from '@ant-design/icons';
import { Wall } from '@/types/exhibition.types';

const { Title } = Typography;

interface WallProps {
  wall: Wall;
  onEdit?: (wall: Wall) => void;
  onDelete?: (wallId: string) => void;
  onClick?: (wallId: string) => void;
  selected?: boolean;
}

const WallComponent: React.FC<WallProps> = ({ 
  wall, 
  onEdit, 
  onDelete, 
  onClick,
  selected = false
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(wall.id);
    }
  };

  // Count artworks
  const artworkCount = wall.placements?.length || 0;
  
  // Calculate status
  const isComplete = artworkCount === 3; // Assuming 3 slots per wall
  const isEmpty = artworkCount === 0;
  const statusColor = isComplete ? 'success' : isEmpty ? 'default' : 'processing';
  const statusText = isComplete ? 'Complete' : isEmpty ? 'Empty' : 'In progress';

  return (
    <Card 
      title={
        <div className="flex items-center">
          <LayoutOutlined className="mr-2" />
          <Title level={4} style={{ margin: 0 }}>{wall.name}</Title>
        </div>
      }
      extra={
        <div className="flex space-x-2">
          {onEdit && (
            <Tooltip title="Edit wall">
              <Button 
                icon={<EditOutlined />} 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(wall);
                }}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Popconfirm
              title="Delete this wall?"
              description="This will remove this wall and all artwork placements on it."
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete(wall.id);
              }}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete wall">
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      }
      className={`mb-4 cursor-pointer transition-shadow hover:shadow-md ${selected ? 'border-2 border-blue-500' : ''}`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-center">
        <div className="text-gray-500">
          <p>Display Order: {wall.displayOrder}</p>
          <p className="flex items-center">
            <span className="mr-2">Status:</span>
            <Badge status={statusColor} text={statusText} />
          </p>
        </div>
        <div>
          <Badge 
            count={artworkCount} 
            overflowCount={99}
            showZero
            style={{ 
              backgroundColor: isComplete ? '#52c41a' : isEmpty ? '#d9d9d9' : '#1890ff',
            }}
          />
          <div className="text-xs text-center mt-1">Artworks</div>
        </div>
      </div>
    </Card>
  );
};

export default WallComponent;