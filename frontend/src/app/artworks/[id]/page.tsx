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
  List,
  Input,
  Avatar,
  Popconfirm,
  message,
  Image
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  LikeOutlined, 
  DislikeOutlined,
  CommentOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { getArtworkById, deleteArtwork } from '@/lib/api/index';
import { Artwork, Comment } from '@/types/artwork.types';
import { formatDate, formatImageUrl } from '@/utils/format';

const { TextArea } = Input;

const ArtworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchArtwork = async () => {
      setLoading(true);
      try {
        const artworkData = await getArtworkById(id as string);
        console.log('Fetched artwork:', artworkData);
        setArtwork(artworkData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArtwork();
    }
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteArtwork(id as string);
      message.success('Artwork deleted successfully');
      router.push('/artist'); // Redirect to artist dashboard
    } catch (err: any) {
      message.error(err.message || 'Failed to delete artwork');
    }
  };

  // Comment submission is a placeholder since backend logic might differ
  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !user) return;
    
    setSubmittingComment(true);
    try {
      // Placeholder for comment submission
      // await submitComment(id as string, commentText);
      
      // For now, we'll just simulate adding the comment
      setArtwork(prev => {
        if (!prev) return prev;
        
        const newComment: Comment = {
          id: `temp-${Date.now()}`,
          content: commentText,
          userId: user.id,
          user: user,
          artworkId: prev.id,
          timestamp: new Date().toISOString()
        };
        
        return {
          ...prev,
          comments: [...(prev.comments || []), newComment]
        };
      });
      
      setCommentText('');
      message.success('Comment added');
    } catch (err: any) {
      message.error(err.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
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
          message="Error Loading Artwork"
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

  if (!artwork) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert
          message="Artwork Not Found"
          description="The artwork you are looking for could not be found."
          type="warning"
          showIcon
        />
        <Button 
          onClick={() => router.push('/artworks')} 
          className="mt-4"
          icon={<ArrowLeftOutlined />}
        >
          Browse All Artworks
        </Button>
      </div>
    );
  }

  const isArtist = user?.id === artwork.artistId;
  const isCurator = user?.role === 'curator';
  const isAdmin = user?.role === 'admin';
  const canEdit = isArtist || isAdmin;
  const canDelete = isArtist || isAdmin;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <Button 
        onClick={() => router.back()} 
        className="mb-6"
        icon={<ArrowLeftOutlined />}
      >
        Back
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Artwork Image */}
        <div className="lg:col-span-2">
          <Card className="mb-6 overflow-hidden">
            <div className="flex justify-center">
              <Image
                src={formatImageUrl(artwork.fileUrl)}
                alt={artwork.title}
                width={600}
                height={600}
                className="max-w-full max-h-[600px] object-contain"
              />
            </div>
          </Card>
          
          {/* Action Buttons */}
          {(canEdit || canDelete) && (
            <div className="flex space-x-4 mb-6">
              {canEdit && (
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => router.push(`/artworks/${artwork.id}/edit`)}
                >
                  Edit Artwork
                </Button>
              )}
              
              {canDelete && (
                <Popconfirm
                  title="Delete Artwork"
                  description="Are you sure you want to delete this artwork? This action cannot be undone."
                  onConfirm={handleDelete}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Delete Artwork
                  </Button>
                </Popconfirm>
              )}
            </div>
          )}
          
          {/* Comments Section */}
          <Card title="Comments" className="mb-6">
            {artwork.comments && artwork.comments.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={artwork.comments}
                renderItem={(comment) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar icon={<UserOutlined />} src={comment.user?.profileUrl} />
                      }
                      title={
                        <div className="flex justify-between">
                          <span>{comment.user?.username || 'Anonymous'}</span>
                          <span className="text-gray-500 text-sm">
                            {formatDate(comment.timestamp)}
                          </span>
                        </div>
                      }
                      description={comment.content}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center py-4 text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            )}
            
            {user ? (
              <div className="mt-4">
                <TextArea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  disabled={submittingComment}
                />
                <Button
                  type="primary"
                  onClick={handleCommentSubmit}
                  loading={submittingComment}
                  disabled={!commentText.trim()}
                  className="mt-2"
                  icon={<CommentOutlined />}
                >
                  Add Comment
                </Button>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <Alert
                  message="Please log in to comment"
                  type="info"
                  showIcon
                  action={
                    <Button size="small" onClick={() => router.push('/login')}>
                      Log In
                    </Button>
                  }
                />
              </div>
            )}
          </Card>
        </div>
        
        {/* Artwork Info */}
        <div className="lg:col-span-1">
          <Card>
            <h1 className="text-2xl font-bold mb-2">{artwork.title}</h1>
            
            <div className="flex items-center mb-4">
              <Avatar 
                icon={<UserOutlined />} 
                src={artwork.artist?.profileUrl}
                className="mr-2"
              />
              <span 
                className="text-blue-600 cursor-pointer hover:underline"
                onClick={() => artwork.artist && router.push(`/profile/${artwork.artist.username}`)}
              >
                {artwork.artist?.username || `Artist #${artwork.artistId}`}
              </span>
            </div>
            
            <Divider />
            
            <Descriptions layout="vertical" column={1}>
              <Descriptions.Item label="Description">
                {artwork.description}
              </Descriptions.Item>
              
              <Descriptions.Item label="Category">
                {artwork.category}
              </Descriptions.Item>
              
              <Descriptions.Item label="Creation Date">
                {formatDate(artwork.creationDate)}
              </Descriptions.Item>
              
              <Descriptions.Item label="Tags">
                {artwork.tags && artwork.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {artwork.tags.map((tag) => (
                      <Tag key={tag} color="blue">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">No tags</span>
                )}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            {/* Placeholder for additional artwork actions */}
            <div className="flex justify-between">
              <Button icon={<LikeOutlined />}>Like</Button>
              <Button icon={<DislikeOutlined />}>Dislike</Button>
              <Button 
                type="primary" 
                onClick={() => router.push(`/exhibitions?artwork=${artwork.id}`)}
              >
                View in Exhibition
              </Button>
            </div>
            
            {/* Show in which exhibitions this artwork appears */}
            {artwork.exhibitionItems && artwork.exhibitionItems.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold mb-2">Featured in Exhibitions</h3>
                <List
                  size="small"
                  dataSource={artwork.exhibitionItems}
                  renderItem={(item) => (
                    <List.Item
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/exhibitions/${item.exhibitionId}`)}
                    >
                      Exhibition #{item.exhibitionId}
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetailPage;