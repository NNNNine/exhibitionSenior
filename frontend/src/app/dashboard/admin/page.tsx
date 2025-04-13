'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Statistic, Table, Tag, message, Spin, Modal, Form, Input, Select, Alert, Badge, Popconfirm } from 'antd';
import { UserOutlined, EnvironmentOutlined, PictureOutlined, DeleteOutlined, EditOutlined, LockOutlined, InfoCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/contexts/AuthContext';
import { UserRole, User } from '@/types/user.types';
import { getUsers, getArtworks, getExhibitions, updateUser, deleteUser } from '@/lib/api/index';
import { formatDate } from '@/utils/format';
import { Artwork } from '@/types/artwork.types';
import { Exhibition } from '@/types/exhibition.types';

const { Option } = Select;

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArtists: 0,
    totalCurators: 0,
    totalVisitors: 0,
    totalArtworks: 0,
    totalExhibitions: 0,
    activeExhibitions: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all users
        const { users: fetchedUsers } = await getUsers({
          limit: 100,
        });
        
        // Get counts for artworks and exhibitions
        const { artworks: fetchedArtworks, pagination: artworkPagination } = await getArtworks({ limit: 20 });
        const { exhibitions: fetchedExhibitions, pagination: exhibitionPagination } = await getExhibitions({ limit: 20 });
        
        setUsers(fetchedUsers);
        setArtworks(fetchedArtworks);
        setExhibitions(fetchedExhibitions);
        
        // Calculate statistics
        setStats({
          totalUsers: fetchedUsers.length,
          totalArtists: fetchedUsers.filter(u => u.role === UserRole.ARTIST).length,
          totalCurators: fetchedUsers.filter(u => u.role === UserRole.CURATOR).length,
          totalVisitors: fetchedUsers.filter(u => u.role === UserRole.VISITOR).length,
          totalArtworks: artworkPagination.total,
          totalExhibitions: exhibitionPagination.total,
          activeExhibitions: fetchedExhibitions.filter(e => e.isActive).length
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
        message.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle user edit button click
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setEditModalVisible(true);
  };

  // Handle user delete button click
  const handleDeleteUser = (user: User) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteUser(user.id);
          setUsers(prev => prev.filter(u => u.id !== user.id));
          setStats(prev => ({
            ...prev,
            totalUsers: prev.totalUsers - 1,
            totalArtists: user.role === UserRole.ARTIST ? prev.totalArtists - 1 : prev.totalArtists,
            totalCurators: user.role === UserRole.CURATOR ? prev.totalCurators - 1 : prev.totalCurators,
            totalVisitors: user.role === UserRole.VISITOR ? prev.totalVisitors - 1 : prev.totalVisitors,
          }));
          message.success(`User "${user.username}" has been deleted`);
        } catch (error) {
          console.error('Failed to delete user:', error);
          message.error('Failed to delete user');
        }
      }
    });
  };

  // Handle user edit form submission
  const handleEditSubmit = async (values: any) => {
    if (!selectedUser) return;
    
    try {
      const updatedUser = await updateUser(selectedUser.id, values);
      
      // Update users list with the updated user
      setUsers(prev => prev.map(u => 
        u.id === updatedUser.id ? updatedUser : u
      ));
      
      // Update stats if role changed
      if (selectedUser.role !== updatedUser.role) {
        setStats(prev => ({
          ...prev,
          totalArtists: prev.totalArtists + (updatedUser.role === UserRole.ARTIST ? 1 : 0) - (selectedUser.role === UserRole.ARTIST ? 1 : 0),
          totalCurators: prev.totalCurators + (updatedUser.role === UserRole.CURATOR ? 1 : 0) - (selectedUser.role === UserRole.CURATOR ? 1 : 0),
          totalVisitors: prev.totalVisitors + (updatedUser.role === UserRole.VISITOR ? 1 : 0) - (selectedUser.role === UserRole.VISITOR ? 1 : 0),
        }));
      }
      
      message.success(`User "${updatedUser.username}" has been updated`);
      setEditModalVisible(false);
    } catch (error) {
      console.error('Failed to update user:', error);
      message.error('Failed to update user');
    }
  };

  // Handle artwork moderation (mock implementation)
  const handleArtworkModeration = (artwork: Artwork, action: 'approve' | 'reject') => {
    Modal.confirm({
      title: action === 'approve' ? 'Approve Artwork' : 'Reject Artwork',
      content: `Are you sure you want to ${action} "${artwork.title}"?`,
      okText: action === 'approve' ? 'Approve' : 'Reject',
      okButtonProps: { danger: action === 'reject' },
      onOk: () => {
        message.success(`Artwork "${artwork.title}" has been ${action}d`);
        // In a real implementation, this would call the API to update the artwork status
      }
    });
  };

  // Handle exhibition status toggle (mock implementation)
  const handleExhibitionStatusToggle = (exhibition: Exhibition) => {
    Modal.confirm({
      title: exhibition.isActive ? 'Deactivate Exhibition' : 'Activate Exhibition',
      content: `Are you sure you want to ${exhibition.isActive ? 'deactivate' : 'activate'} "${exhibition.title}"?`,
      onOk: () => {
        // Update exhibition status locally for demo purposes
        setExhibitions(prev => prev.map(e => 
          e.id === exhibition.id ? {...e, isActive: !e.isActive} : e
        ));

        // Update stats
        setStats(prev => ({
          ...prev,
          activeExhibitions: exhibition.isActive 
            ? prev.activeExhibitions - 1 
            : prev.activeExhibitions + 1
        }));

        message.success(`Exhibition "${exhibition.title}" has been ${exhibition.isActive ? 'deactivated' : 'activated'}`);
        // In a real implementation, this would call the API to update the exhibition status
      }
    });
  };

  // Define columns for the users table
  const userColumns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: User) => (
        <Button 
          type="link" 
          onClick={() => router.push(`/profile/${record.username}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => {
        let color = 'default';
        switch (role) {
          case UserRole.ADMIN:
            color = 'red';
            break;
          case UserRole.CURATOR:
            color = 'green';
            break;
          case UserRole.ARTIST:
            color = 'blue';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => formatDate(text),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <div className="space-x-2">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditUser(record)} 
            size="small" 
          />
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            onClick={() => handleDeleteUser(record)} 
            size="small" 
            disabled={record.role === UserRole.ADMIN} // Prevent deleting admins
          />
          <Button 
            icon={<LockOutlined />} 
            onClick={() => message.info('Reset password functionality would go here')} 
            size="small" 
          />
        </div>
      ),
    },
  ];

  // Define columns for the artworks table
  const artworkColumns = [
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnailUrl',
      key: 'thumbnailUrl',
      render: (text: string, record: Artwork) => (
        <img 
          src={text || `https://placehold.co/100x100?text=${encodeURIComponent(record.title)}`} 
          alt={record.title} 
          style={{ width: 60, height: 60, objectFit: 'cover' }} 
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
          onClick={() => artist ? router.push(`/profile/${artist.username}`) : null}
        >
          {artist?.username || `Artist #${record.artistId}`}
        </Button>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Artwork) => {
        // Mock status based on whether artwork is in any exhibitions
        const hasExhibitions = record.exhibitionItems && record.exhibitionItems.length > 0;
        return (
          <Badge 
            status={hasExhibitions ? "success" : "warning"} 
            text={hasExhibitions ? "Approved" : "Pending"} 
          />
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => formatDate(text),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Artwork) => {
        // Mock status based on whether artwork is in any exhibitions
        const hasExhibitions = record.exhibitionItems && record.exhibitionItems.length > 0;
        
        return (
          <div className="space-x-2">
            <Button 
              icon={<InfoCircleOutlined />} 
              onClick={() => router.push(`/artworks/${record.id}`)} 
              size="small" 
            />
            {!hasExhibitions && (
              <>
                <Button 
                  icon={<CheckCircleOutlined />} 
                  type="primary" 
                  size="small" 
                  onClick={() => handleArtworkModeration(record, 'approve')}
                />
                <Button 
                  icon={<StopOutlined />} 
                  danger 
                  size="small"
                  onClick={() => handleArtworkModeration(record, 'reject')}
                />
              </>
            )}
          </div>
        );
      },
    },
  ];

  // Define columns for the exhibitions table
  const exhibitionColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Exhibition) => (
        <Button 
          type="link" 
          onClick={() => router.push(`/exhibitions/${record.id}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Curator',
      dataIndex: 'curator',
      key: 'curator',
      render: (curator: any, record: Exhibition) => (
        <Button 
          type="link" 
          onClick={() => curator ? router.push(`/profile/${curator.username}`) : null}
        >
          {curator?.username || `Curator #${record.curatorId}`}
        </Button>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Badge 
          status={isActive ? "success" : "warning"} 
          text={isActive ? "Active" : "Inactive"} 
        />
      ),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (text: string) => formatDate(text),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (text: string) => formatDate(text),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Exhibition) => (
        <div className="space-x-2">
          <Button 
            icon={<InfoCircleOutlined />} 
            onClick={() => router.push(`/exhibitions/${record.id}`)} 
            size="small" 
          />
          <Popconfirm
            title={`${record.isActive ? 'Deactivate' : 'Activate'} exhibition`}
            onConfirm={() => handleExhibitionStatusToggle(record)}
            okText={record.isActive ? 'Deactivate' : 'Activate'}
            cancelText="Cancel"
          >
            <Button 
              icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />} 
              type={record.isActive ? "default" : "primary"}
              danger={record.isActive}
              size="small" 
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <Statistic 
            title="Total Users" 
            value={stats.totalUsers} 
            prefix={<UserOutlined />} 
          />
        </Card>
        <Card>
          <Statistic 
            title="Artists" 
            value={stats.totalArtists} 
            prefix={<UserOutlined />} 
          />
        </Card>
        <Card>
          <Statistic 
            title="Curators" 
            value={stats.totalCurators} 
            prefix={<UserOutlined />} 
          />
        </Card>
        <Card>
          <Statistic 
            title="Visitors" 
            value={stats.totalVisitors} 
            prefix={<UserOutlined />} 
          />
        </Card>
        <Card>
          <Statistic 
            title="Artworks" 
            value={stats.totalArtworks} 
            prefix={<PictureOutlined />} 
          />
        </Card>
        <Card>
          <Statistic 
            title="Exhibitions" 
            value={stats.totalExhibitions} 
            prefix={<EnvironmentOutlined />} 
          />
        </Card>
      </div>
      
      {/* Tabs for different management functions */}
      <Tabs 
        defaultActiveKey="users"
        items={[
          {
            key: 'users',
            label: 'User Management',
            children: (
              <Card>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Spin size="large" />
                  </div>
                ) : (
                  <Table 
                    dataSource={users}
                    columns={userColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                )}
              </Card>
            )
          },
          {
            key: 'artworks',
            label: 'Artwork Management',
            children: (
              <Card>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Spin size="large" />
                  </div>
                ) : (
                  <Table 
                    dataSource={artworks}
                    columns={artworkColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                )}
              </Card>
            )
          },
          {
            key: 'exhibitions',
            label: 'Exhibition Management',
            children: (
              <Card>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Spin size="large" />
                  </div>
                ) : (
                  <Table 
                    dataSource={exhibitions}
                    columns={exhibitionColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                )}
              </Card>
            )
          },
          {
            key: 'settings',
            label: 'System Settings',
            children: (
              <>
                <Card title="System Configuration">
                  <Form layout="vertical">
                    <Form.Item label="Exhibition Default Duration (days)" name="exhibitionDuration">
                      <Input type="number" defaultValue={30} />
                    </Form.Item>
                    
                    <Form.Item label="Maximum Upload Size (MB)" name="maxUploadSize">
                      <Input type="number" defaultValue={10} />
                    </Form.Item>
                    
                    <Form.Item label="Allowed File Types" name="allowedFileTypes">
                      <Select mode="multiple" defaultValue={['jpg', 'png', 'tiff']}>
                        <Option value="jpg">JPG</Option>
                        <Option value="png">PNG</Option>
                        <Option value="tiff">TIFF</Option>
                        <Option value="gif">GIF</Option>
                        <Option value="webp">WEBP</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item label="Enable User Registration" name="enableRegistration" valuePropName="checked">
                      <Select defaultValue="all">
                        <Option value="all">All Roles</Option>
                        <Option value="visitors">Visitors Only</Option>
                        <Option value="artists">Artists and Visitors</Option>
                        <Option value="none">Disabled (Admin Only)</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item label="Maintenance Mode" name="maintenanceMode" valuePropName="checked">
                      <Select defaultValue="off">
                        <Option value="off">Off</Option>
                        <Option value="scheduled">Scheduled</Option>
                        <Option value="on">On (Admin Access Only)</Option>
                      </Select>
                    </Form.Item>
                    
                    <Button type="primary">Save Settings</Button>
                  </Form>
                </Card>
                
                <Card title="Advanced Settings" className="mt-6">
                  <Button className="mr-4" onClick={() => message.info('Database backup would start here')}>
                    Database Backup
                  </Button>
                  <Button className="mr-4" onClick={() => message.info('System logs would be shown here')}>
                    View System Logs
                  </Button>
                  <Button danger onClick={() => {
                    Modal.confirm({
                      title: 'Clear All Cache',
                      content: 'Are you sure you want to clear all system cache? This may temporarily slow down the system.',
                      onOk: () => message.success('Cache cleared successfully')
                    });
                  }}>
                    Clear Cache
                  </Button>
                </Card>
              </>
            )
          }
        ]}
      />
      
      {/* User Edit Modal */}
      <Modal
        title="Edit User"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please input username!' },
              { min: 3, message: 'Username must be at least 3 characters' }
            ]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input email!' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role!' }]}
          >
            <Select>
              <Option value={UserRole.VISITOR}>Visitor</Option>
              <Option value={UserRole.ARTIST}>Artist</Option>
              <Option value={UserRole.CURATOR}>Curator</Option>
              <Option value={UserRole.ADMIN}>Admin</Option>
            </Select>
          </Form.Item>
          
          <Alert
            message="Note on Role Changes"
            description="Changing a user's role will affect their permissions and access throughout the system."
            type="warning"
            showIcon
            className="mb-4"
          />
          
          <div className="flex justify-end">
            <Button onClick={() => setEditModalVisible(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default withProtectedRoute(AdminDashboard, {
  requiredRoles: [UserRole.CURATOR],
  redirectTo: '/unauthorized',
});