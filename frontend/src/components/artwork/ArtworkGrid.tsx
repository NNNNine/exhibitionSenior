'use client';

import React from 'react';
import { Card, Empty, Spin, Tag, Image } from 'antd';
import { useRouter } from 'next/navigation';
import { Artwork } from '@/types/artwork.types';
import { formatImageUrl } from '@/utils/format';

const { Meta } = Card;

interface ArtworkGridProps {
  artworks: Artwork[];
  loading?: boolean;
  onArtworkClick?: (artwork: Artwork) => void;
  renderExtraInfo?: (artwork: Artwork) => React.ReactNode;
  emptyText?: string;
  columns?: number;
}

const ArtworkGrid: React.FC<ArtworkGridProps> = ({
  artworks,
  loading = false,
  onArtworkClick,
  renderExtraInfo,
  emptyText = 'No artworks found',
  columns = 3,
}) => {
  const router = useRouter();

  // Calculate column class based on columns prop
  const getColumnClass = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  const handleArtworkClick = (artwork: Artwork) => {
    if (onArtworkClick) {
      onArtworkClick(artwork);
    } else {
      router.push(`/artworks/${artwork.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!artworks || artworks.length === 0) {
    return <Empty description={emptyText} />;
  }

  return (
    <div className={`grid ${getColumnClass()} gap-6`}>
      {artworks.map((artwork) => (
        <Card
          key={artwork.id}
          hoverable
          onClick={() => handleArtworkClick(artwork)}
          cover={
            <div className="aspect-w-1 aspect-h-1 overflow-hidden bg-gray-100">
              <Image
                alt={artwork.title}
                src={formatImageUrl(artwork.thumbnailUrl || artwork.fileUrl)}
                className="h-full w-full object-cover"
                width={300}
                height={300}
              />
            </div>
          }
          className="h-full flex flex-col"
        >
          <Meta
            title={artwork.title}
            description={
              <div>
                <p className="text-sm text-gray-500 truncate mb-2">
                  by {artwork.artist?.username || `Artist #${artwork.artistId}`}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  <Tag color="blue">{artwork.category}</Tag>
                  {artwork.tags && artwork.tags.slice(0, 2).map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                  {artwork.tags && artwork.tags.length > 2 && (
                    <Tag>+{artwork.tags.length - 2}</Tag>
                  )}
                </div>
                {renderExtraInfo && renderExtraInfo(artwork)}
              </div>
            }
          />
        </Card>
      ))}
    </div>
  );
};

export default ArtworkGrid;