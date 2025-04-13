'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Popconfirm, 
  Space, 
  Tag, 
  Spin, 
  Avatar, 
  Tooltip,
  Input as AntInput
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  LockOutlined, 
  SearchOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { withProtectedRoute } from '@/contexts/AuthContext';
import { UserRole, User } from '@/types/user.types';
import { getUsers, updateUser, deleteUser } from '@/lib/api';

const { Option } = Select;

const UserManagementPage: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Load users on initial render
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users with optional filters
  const fetchUsers = async (page = pagination.current, pageSize = pagination.pageSize, search = searchText) => {
    setLoading(true);
    try {
      const { users: fetchedUsers, pagination: paginationData } = await getUsers({
        search,
        page,
        limit: pageSize
      });
      
      setUsers(fetchedUsers);
      setPagination({
        current: paginationData.page,
        pageSize: paginationData.limit,
        total: paginationData.total
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Handle search 
  const handleSearch = () => {
    fetchUsers(1, pagination.pageSize, searchText);
  };

  // Handle table pagination change
  const handleTableChange = (pagination: any) => {
    fetchUsers(pagination.current, pagination.pageSize);
  };

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

  // Handle user delete
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      message.success('User deleted successfully');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete user:', error);
      message.error('Failed to delete user');
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (values: any) => {
    if (!selectedUser) return;
    
    try {
      const updatedUser = await updateUser(selectedUser.id, values);
      
      // Update the users list
      setUsers(prev => prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      message.success('User updated successfully');
      setEditModalVisible(false);
    } catch (error) {
      console.error('Failed to update user:', error);
      message.error('Failed to update user');
    }
  };

  // Handle password reset
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    passwordForm.resetFields();
    setResetPasswordVisible(true);
  };

  // Handle password reset submission
  const handlePasswordSubmit = async (values: any) => {
    if (!selectedUser) return;
    
    try {
      // TODO: Implement password reset logic
      // In a real implementation, this would call an API endpoint 
      // to reset the user's password
      
      // Mock implementation
      message.success(`Password for ${selectedUser.username} has been reset`);
      setResetPasswordVisible(false);
    } catch (error) {
      console.error('Failed to reset password:', error);
      message.error('Failed to reset password');
    }
  };

  // Define table columns
  const columns = [
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: User) => (
        <div className="flex items-center">
          <Avatar 
            icon={<UserOutlined />} 
            src={record.profileUrl}
            className="mr-2"
          />
          <span>{text}</span>
        </div>
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
        let color = '';
        switch (role) {
          case UserRole.CURATOR:
            color = 'green';
            break;
          case UserRole.ARTIST:
            color = 'blue';
            break;
          case UserRole.VISITOR:
            color = 'default';
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
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="small">
          <Tooltip title="Edit User">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEditUser(record)} 
              size="small" 
            />
          </Tooltip>
          <Tooltip title="Reset Password">
            <Button 
              icon={<LockOutlined />} 
              onClick={() => handleResetPassword(record)} 
              size="small" 
            />
          </Tooltip>
          <Tooltip title="Delete User">
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record.id)}
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button 
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => router.push('/auth/register')}
        >
          Add New User
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <AntInput
              placeholder="Search by name or email"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
          </div>
          <Button type="primary" onClick={handleSearch}>Search</Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <Table 
            columns={columns} 
            dataSource={users}
            rowKey="id"
            pagination={{ 
              ...pagination,
              showSizeChanger: true, 
              showTotal: (total) => `Total ${total} users` 
            }}
            onChange={handleTableChange}
          />
        )}
      </Card>

      {/* Edit User Modal */}
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
            </Select>
          </Form.Item>
          
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

      {/* Reset Password Modal */}
      <Modal
        title="Reset Password"
        open={resetPasswordVisible}
        onCancel={() => setResetPasswordVisible(false)}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordSubmit}
        >
          <p className="mb-4">
            Enter a new password for user: 
            <strong> {selectedUser?.username}</strong>
          </p>
          
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please input new password!' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          
          <div className="flex justify-end">
            <Button onClick={() => setResetPasswordVisible(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Reset Password
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default withProtectedRoute(UserManagementPage, {
  requiredRoles: [UserRole.CURATOR],
  redirectTo: '/unauthorized',
});