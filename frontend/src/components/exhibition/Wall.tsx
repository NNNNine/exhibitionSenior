// frontend/src/components/exhibition/Wall.tsx
import React from 'react';
import { Card, Typography, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
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

  return (
    <Card 
      title={
        <Title level={4} style={{ margin: 0 }}>{wall.name}</Title>
      }
      extra={
        <div className="flex space-x-2">
          {onEdit && (
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(wall);
              }}
            />
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
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          )}
        </div>
      }
      className={`mb-4 cursor-pointer transition-shadow hover:shadow-md ${selected ? 'border-2 border-blue-500' : ''}`}
      onClick={handleClick}
    >
      <div className="text-gray-500">
        <p>Display Order: {wall.displayOrder}</p>
        <p>Placed Artworks: {wall.placements?.length || 0}</p>
      </div>
    </Card>
  );
};

export default WallComponent;