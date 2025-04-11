// frontend/src/components/exhibition/WallLayout.tsx
import React from 'react';
import { useDrop } from 'react-dnd';
import { Typography, Button, Image } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { Wall, PlacementPosition, ArtworkPlacement, DraggableArtwork } from '@/types/exhibition.types';
import { formatImageUrl } from '@/utils/format';

const { Title, Text } = Typography;

interface WallLayoutProps {
  wall: Wall;
  onArtworkPlace: (artworkId: string, position: PlacementPosition, wallId: string) => void;
  onArtworkRemove: (placementId: string) => void;
}

const WallLayout: React.FC<WallLayoutProps> = ({ 
  wall, 
  onArtworkPlace, 
  onArtworkRemove
}) => {
  // Get existing placements for each position
  const leftPlacement = wall.placements?.find(p => p.position === PlacementPosition.LEFT);
  const centerPlacement = wall.placements?.find(p => p.position === PlacementPosition.CENTER);
  const rightPlacement = wall.placements?.find(p => p.position === PlacementPosition.RIGHT);

  return (
    <div className="my-6">
      <Title level={3}>{wall.name} Layout</Title>
      
      <div className="flex flex-wrap justify-between gap-4 p-4 bg-gray-100 rounded-lg">
        {/* Left Position */}
        <PlacementSlot 
          position={PlacementPosition.LEFT}
          placement={leftPlacement}
          wallId={wall.id}
          onArtworkPlace={onArtworkPlace}
          onArtworkRemove={onArtworkRemove}
        />
        
        {/* Center Position */}
        <PlacementSlot 
          position={PlacementPosition.CENTER}
          placement={centerPlacement}
          wallId={wall.id}
          onArtworkPlace={onArtworkPlace}
          onArtworkRemove={onArtworkRemove}
        />
        
        {/* Right Position */}
        <PlacementSlot 
          position={PlacementPosition.RIGHT}
          placement={rightPlacement}
          wallId={wall.id}
          onArtworkPlace={onArtworkPlace}
          onArtworkRemove={onArtworkRemove}
        />
      </div>
    </div>
  );
};

interface PlacementSlotProps {
  position: PlacementPosition;
  placement?: ArtworkPlacement;
  wallId: string;
  onArtworkPlace: (artworkId: string, position: PlacementPosition, wallId: string) => void;
  onArtworkRemove: (placementId: string) => void;
}

const PlacementSlot: React.FC<PlacementSlotProps> = ({
  position,
  placement,
  wallId,
  onArtworkPlace,
  onArtworkRemove
}) => {
  // Set up drop target
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ARTWORK',
    drop: (item: DraggableArtwork) => {
      onArtworkPlace(item.id, position, wallId);
      return { position, wallId };
    },
    canDrop: () => !placement, // Only allow drop if no artwork is already placed
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Render the slot
  const positionTitle = {
    [PlacementPosition.LEFT]: 'Left',
    [PlacementPosition.CENTER]: 'Center',
    [PlacementPosition.RIGHT]: 'Right',
    [PlacementPosition.CUSTOM]: 'Custom',
  };

  // Determine the background color based on drop state
  let backgroundColor = 'bg-white';
  if (isOver && canDrop) {
    backgroundColor = 'bg-green-100';
  } else if (canDrop) {
    backgroundColor = 'bg-blue-50';
  } else if (placement) {
    backgroundColor = 'bg-white';
  }

  return (
    <div 
      ref={(node) => {
        drop(node);
      }}
      className={`flex-1 min-w-64 min-h-64 p-2 rounded border-2 ${
        isOver && canDrop 
          ? 'border-green-500' 
          : placement 
            ? 'border-gray-300' 
            : 'border-dashed border-gray-300'
      } ${backgroundColor} transition-colors duration-200`}
    >
      <div className="flex justify-between items-center mb-2">
        <Text strong>{positionTitle[position]}</Text>
        
        {placement && (
          <Button 
            type="text" 
            danger 
            icon={<CloseOutlined />} 
            size="small"
            onClick={() => onArtworkRemove(placement.id)}
          />
        )}
      </div>
      
      {placement ? (
        <div className="p-2">
          <Image
            src={formatImageUrl(placement.artwork.thumbnailUrl || placement.artwork.fileUrl)}
            alt={placement.artwork.title}
            className="w-full h-48 object-contain"
            fallback="data:image/png;base64,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"
          />
          <div className="mt-2">
            <Text strong ellipsis className="block">{placement.artwork.title}</Text>
            <Text type="secondary" ellipsis className="block">
              By {placement.artwork.artist?.username || `Artist #${placement.artwork.artistId}`}
            </Text>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-gray-400">
          {canDrop ? 'Drop artwork here' : 'Empty slot'}
        </div>
      )}
    </div>
  );
};

export default WallLayout;