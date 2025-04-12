'use client';

import { Card, Tag, Typography, Tooltip } from 'antd';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { formatImageUrl } from '@/utils/format';
import { EyeOutlined, HeartOutlined, HeartFilled, CommentOutlined } from '@ant-design/icons';
import { ArtworkWithLikes } from '@/types/artwork.types';

const { Meta } = Card;
const { Text } = Typography;

interface ArtworkCardProps {
  artwork: ArtworkWithLikes;
  onLikeClick?: (artworkId: string, isLiked: boolean) => void;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, onLikeClick }) => {
  const {
    id,
    title,
    thumbnailUrl,
    category,
    artist,
    creationDate,
    tags = [],
    likes = 0,
    comments = [],
    isLiked = false
  } = artwork;

  // Format the creation date
  const formattedDate = creationDate 
    ? formatDistanceToNow(new Date(creationDate), { addSuffix: true })
    : 'Unknown date';

  // Handle like button click
  const handleLikeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent card click from firing
    if (onLikeClick) {
      onLikeClick(id, !isLiked);
    }
  };

  // Generate a placeholder if image is not available
  const imageUrl = formatImageUrl(thumbnailUrl || artwork.fileUrl)

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/artworks/${id}`}>
        <Card
          hoverable
          className="hover:shadow-lg"
          style={{ 
            overflow: 'hidden', 
            transitionProperty: 'box-shadow', 
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDuration: '150ms',
          }}
          cover={
            <div style={{ position: 'relative', height: '12rem', overflow: 'hidden' }}>
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{
                  objectFit: 'cover',
                  transition: 'transform 0.5s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />

              <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
               <Tag color="blue">{category}</Tag>
              </div>
            </div>
          }
          actions={[
            <Tooltip title="View details" key="view">
              <EyeOutlined />
            </Tooltip>,
            <Tooltip title={isLiked ? "Unlike" : "Like"} key="like">
              <div onClick={handleLikeClick}>
                {isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                <span className="ml-1">{likes}</span>
              </div>
            </Tooltip>,
            <Tooltip title="Comments" key="comments">
              <div>
                <CommentOutlined />
                <span className="ml-1">{comments?.length || 0}</span>
              </div>
            </Tooltip>
          ]}
        >
          <Meta
            title={title}
            description={
              <div>
                <div className="mb-2">
                  <Text type="secondary">By </Text>
                  <Link href={`/profile/${artist?.username}`}>
                    <Text 
                      strong 
                      style={{ color: '#1d4ed8', cursor: 'pointer', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#1e40af')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                    >
                      {artist?.username || 'Unknown Artist'}
                    </Text>
                  </Link>
                </div>
                <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                  {formattedDate}
                </Text>
                <div className="mt-2 space-x-1">
                  {tags.slice(0, 3).map(tag => (
                    <Tag 
                      key={tag} 
                      style={{ marginRight: '0.25rem' }}
                    >
                      {tag}
                    </Tag>
                  ))}
                  {tags.length > 3 && (
                    <Tag>+{tags.length - 3}</Tag>
                  )}
                </div>
              </div>
            }
          />
        </Card>
      </Link>
    </motion.div>
  );
};

export default ArtworkCard;