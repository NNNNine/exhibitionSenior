'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Image, 
  Spin, 
  Popconfirm, 
  message, 
  Modal,
  Dropdown,
  Select,
  Input,
  Form,
  Tooltip,
  Badge,
  Divider
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import { Artwork, ArtworkStatus } from '@/types/artwork.types';
import { getArtworks, approveArtwork, rejectArtwork, deleteArtwork } from '@/lib/api/index';
import { formatDate, formatImageUrl } from '@/utils/format';

const { Option } = Select;

const ArtworkManagementPage: React.FC = () => {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [rejectionModalVisible, setRejectionModalVisible] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // Filter states
  const [searchText, setSearchText] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Load artworks on initial render
  useEffect(() => {
    fetchArtworks();
  }, []);

  // Fetch artworks with filters
  const fetchArtworks = async (
    page = pagination.current, 
    pageSize = pagination.pageSize, 
    searchQuery = searchText,
    status = selectedStatus,
    category = selectedCategory
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (status) params.status = status;
      if (category) params.category = category;
      
      const { artworks: fetchedArtworks, pagination: paginationData } = await getArtworks(params);
      
      setArtworks(fetchedArtworks);
      setPagination({
        current: paginationData.page,
        pageSize: paginationData.limit,
        total: paginationData.total
      });
    } catch (error) {
      console.error('Error fetching artworks:', error);
      message.error('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  };

  // Handle search and filters
  const handleApplyFilters = () => {
    fetchArtworks(1); // Reset to first page when applying filters
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchText('');
    setSelectedStatus('');
    setSelectedCategory('');
    fetchArtworks(1, pagination.pageSize, '', '', '');
  };

  // Handle table pagination change
  const handleTableChange = (pagination: any) => {
    fetchArtworks(
      pagination.current, 
      pagination.pageSize,
      searchText,
      selectedStatus,
      selectedCategory
    );
  };

  // Handle artwork approval
  const handleApproveArtwork = async (artworkId: string) => {
    try {
      await approveArtwork(artworkId);
      message.success('Artwork approved successfully');
      
      // Update local state
      setArtworks(prev => 
        prev.map(artwork => 
          artwork.id === artworkId 
            ? { ...artwork, status: ArtworkStatus.APPROVED } 
            : artwork
        )
      );
    } catch (error) {
      console.error('Failed to approve artwork:', error);
      message.error('Failed to approve artwork');
    }
  };

  // Handle artwork rejection modal
  const handleRejectClick = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setRejectionModalVisible(true);
  };

  // Handle artwork rejection submission
  const handleRejectArtwork = async () => {
    if (!selectedArtwork) return;
    
    try {
      await rejectArtwork(selectedArtwork.id, rejectReason);
      message.success('Artwork rejected successfully');
      
      // Update local state
      setArtworks(prev => 
        prev.map(artwork => 
          artwork.id === selectedArtwork.id 
            ? { ...artwork, status: ArtworkStatus.REJECTED } 
            : artwork
        )
      );
      
      // Close modal and reset
      setRejectionModalVisible(false);
      setRejectReason('');
      setSelectedArtwork(null);
    } catch (error) {
      console.error('Failed to reject artwork:', error);
      message.error('Failed to reject artwork');
    }
  };

  // Handle artwork deletion
  const handleDeleteArtwork = async (artworkId: string) => {
    try {
      await deleteArtwork(artworkId);
      message.success('Artwork deleted successfully');
      
      // Remove from local state
      setArtworks(prev => prev.filter(artwork => artwork.id !== artworkId));
    } catch (error) {
      console.error('Failed to delete artwork:', error);
      message.error('Failed to delete artwork');
    }
  };

  // Show artwork details
  const handleViewDetails = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setDetailModalVisible(true);
  };

  // Define table columns
  const columns = [
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnailUrl',
      key: 'thumbnailUrl',
      width: 120,
      render: (text: string, record: Artwork) => (
        <Image 
          src={formatImageUrl(text || record.fileUrl)} 
          alt={record.title}
          width={80}
          height={80}
          style={{ objectFit: 'cover' }}
          fallback="/images/placeholder-image.png"
        />
      ),
    },
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        render: (text: string, record: Artwork) => (
          <Button 
            type="link" 
            onClick={() => router.push(`/artworks/${record.id}`)}
          >
            {text}
          </Button>
        ),
      },
      {
        title: 'Artist',
        dataIndex: 'artist',
        key: 'artist',
        render: (artist: any, record: Artwork) => (
          <Button 
            type="link" 
            onClick={() => artist && router.push(`/profile/${artist.username}`)}
          >
            {artist?.username || `Artist #${record.artistId}`}
          </Button>
        ),
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        render: (text: string) => <Tag color="blue">{text}</Tag>,
      },
      {
        title: 'Uploaded',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date: string) => formatDate(date),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: ArtworkStatus) => {
          let color: 'success' | 'error' | 'warning' | 'default' | 'processing' | undefined = undefined;
          let text = '';
          
          switch (status) {
            case ArtworkStatus.APPROVED:
              color = 'success';
              text = 'Approved';
              break;
            case ArtworkStatus.REJECTED:
              color = 'error';
              text = 'Rejected';
              break;
            case ArtworkStatus.PENDING:
            default:
              color = 'warning';
              text = 'Pending';
              break;
          }
          
          return <Badge status={color} text={text} />;
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: Artwork) => (
          <Space size="small">
            <Tooltip title="View Details">
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => handleViewDetails(record)} 
                size="small"
              />
            </Tooltip>
            
            {record.status === ArtworkStatus.PENDING && (
              <>
                <Tooltip title="Approve Artwork">
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />} 
                    size="small"
                    onClick={() => handleApproveArtwork(record.id)}
                  />
                </Tooltip>
                
                <Tooltip title="Reject Artwork">
                  <Button 
                    danger 
                    icon={<CloseCircleOutlined />} 
                    size="small"
                    onClick={() => handleRejectClick(record)}
                  />
                </Tooltip>
              </>
            )}
            
            <Tooltip title="Delete Artwork">
              <Popconfirm
                title="Are you sure you want to delete this artwork?"
                onConfirm={() => handleDeleteArtwork(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small"
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Button 
        onClick={() => router.back()} 
        style={{ marginBottom: '1.5rem' }}
        icon={<ArrowLeftOutlined />}
      >
        Back
      </Button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Artwork Management</h1>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2">
            <Input
              placeholder="Search by title or artist"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </div>
          
          <div>
            <Select
              placeholder="Filter by status"
              style={{ width: '100%' }}
              value={selectedStatus || undefined}
              onChange={value => setSelectedStatus(value)}
              allowClear
            >
              <Option value={ArtworkStatus.PENDING}>Pending</Option>
              <Option value={ArtworkStatus.APPROVED}>Approved</Option>
              <Option value={ArtworkStatus.REJECTED}>Rejected</Option>
            </Select>
          </div>
          
          <div>
            <Select
              placeholder="Filter by category"
              style={{ width: '100%' }}
              value={selectedCategory || undefined}
              onChange={value => setSelectedCategory(value)}
              allowClear
            >
              <Option value="Painting">Painting</Option>
              <Option value="Photography">Photography</Option>
              <Option value="Digital Art">Digital Art</Option>
              <Option value="Sculpture">Sculpture</Option>
              <Option value="Mixed Media">Mixed Media</Option>
              <Option value="Other">Other</Option>
            </Select>
          </div>
          
          <div className="col-span-1 md:col-span-4 flex justify-end space-x-2">
            <Button icon={<FilterOutlined />} onClick={handleApplyFilters} type="primary">
              Apply Filters
            </Button>
            <Button onClick={handleResetFilters}>Reset</Button>
          </div>
        </div>
      </Card>

      {/* Artworks Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <Table 
            columns={columns} 
            dataSource={artworks}
            rowKey="id"
            pagination={{ 
              ...pagination,
              showSizeChanger: true, 
              showTotal: (total) => `Total ${total} artworks` 
            }}
            onChange={handleTableChange}
          />
        )}
      </Card>

      {/* Artwork Rejection Modal */}
      <Modal
        title="Reject Artwork"
        open={rejectionModalVisible}
        onCancel={() => setRejectionModalVisible(false)}
        onOk={handleRejectArtwork}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <div className="py-2">
          <p className="mb-4">
            Please provide a reason for rejecting 
            <strong> &quot;{selectedArtwork?.title}&quot;</strong>
          </p>
          
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Explain why this artwork is being rejected..."
          />
          
          <div className="mt-4 flex items-center text-gray-500">
            <InfoCircleOutlined className="mr-2" />
            <small>
              This reason will be sent to the artist to help them understand why their artwork was rejected.
            </small>
          </div>
        </div>
      </Modal>

      {/* Artwork Details Modal */}
      {selectedArtwork && (
        <Modal
          title="Artwork Details"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              Close
            </Button>,
            <Button 
              key="view" 
              type="primary" 
              onClick={() => router.push(`/artworks/${selectedArtwork.id}`)}
            >
              View Full Page
            </Button>
          ]}
          width={720}
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <Image
                src={formatImageUrl(selectedArtwork.fileUrl)}
                alt={selectedArtwork.title}
                className="w-full"
              />
            </div>
            
            <div className="w-full md:w-1/2">
              <h3 className="text-xl font-bold mb-2">{selectedArtwork.title}</h3>
              
              <p className="mb-4">
                By: <strong>{selectedArtwork.artist?.username || `Artist #${selectedArtwork.artistId}`}</strong>
              </p>
              
              <Divider orientation="left">Details</Divider>
              
              <p className="whitespace-pre-line mb-4">{selectedArtwork.description}</p>
              
              <p>
                <strong>Category:</strong> {selectedArtwork.category}
              </p>
              
              <p>
                <strong>Creation Date:</strong> {formatDate(selectedArtwork.creationDate)}
              </p>
              
              <p>
                <strong>Upload Date:</strong> {formatDate(selectedArtwork.createdAt)}
              </p>
              
              <div className="mt-4">
                <strong>Tags:</strong>{' '}
                {selectedArtwork.tags && selectedArtwork.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedArtwork.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">No tags</span>
                )}
              </div>
              
              <div className="mt-4">
                <strong>Status:</strong>{' '}
                <Tag 
                  color={
                    selectedArtwork.status === ArtworkStatus.APPROVED ? 'green' :
                    selectedArtwork.status === ArtworkStatus.REJECTED ? 'red' : 'orange'
                  }
                >
                  {selectedArtwork.status}
                </Tag>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default withProtectedRoute(ArtworkManagementPage, {
  requiredRoles: [UserRole.CURATOR],
  redirectTo: '/unauthorized',
});