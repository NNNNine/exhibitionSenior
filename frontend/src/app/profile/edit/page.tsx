'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Upload, Avatar, Select, Alert, Tabs, Switch, Divider } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined, SaveOutlined, MailOutlined, BellOutlined, GlobalOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { ProtectedRoute, useAuthContext } from '@/contexts/AuthContext';
import { updateUser, changePassword } from '@/lib/api/index';

const { TabPane } = Tabs;
const { Option } = Select;

const ProfileEdit: React.FC = () => {
  const router = useRouter();
  const { user, updateUser: updateContextUser } = useAuthContext();
  
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.profileUrl || '');

  // Set initial form values
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        profileUrl: user.profileUrl,
      });
      
      // Set initial preferences if available
      if (user.preferences) {
        preferencesForm.setFieldsValue({
          emailNotifications: user.preferences.emailNotifications ?? true,
          darkMode: user.preferences.darkMode ?? false,
          language: user.preferences.language ?? 'english',
          visibility: user.preferences.visibility ?? 'public',
          displayName: user.preferences.displayName ?? user.username,
          bio: user.preferences.bio ?? '',
        });
      }
      
      if (user.profileUrl) {
        setAvatarUrl(user.profileUrl);
      }
    }
  }, [user, form, preferencesForm]);

  // Handle profile form submission
  const handleSubmit = async (values: any) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedUser = await updateUser(user.id, values);
      updateContextUser(updatedUser);
      message.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (values: any) => {
    setPasswordLoading(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Failed to change password:', error);
      message.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle preferences update
  const handlePreferencesUpdate = async (values: any) => {
    if (!user) return;
    
    setPreferencesLoading(true);
    try {
      const updatedUser = await updateUser(user.id, {
        preferences: values
      });
      updateContextUser(updatedUser);
      message.success('Preferences updated successfully');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      message.error('Failed to update preferences');
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'done') {
      // In a real app, this would update the profile picture URL
      // For now, we'll just pretend it worked
      const fakeUrl = URL.createObjectURL(info.file.originFileObj);
      setAvatarUrl(fakeUrl);
      form.setFieldsValue({ profileUrl: fakeUrl });
      message.success('Avatar updated successfully');
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <Button 
            onClick={() => router.back()}
          >
            Back to Profile
          </Button>
        </div>
        
        <Tabs defaultActiveKey="profile">
          <TabPane tab="Profile Information" key="profile">
            <Card>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center">
                  <Avatar 
                    size={128} 
                    icon={<UserOutlined />} 
                    src={avatarUrl}
                    className="mb-4"
                  />
                  
                  <Upload 
                    name="avatar"
                    showUploadList={false}
                    // In a real app, this would be a real API endpoint
                    action="https://example.com/upload"
                    onChange={handleAvatarChange}
                  >
                    <Button icon={<UploadOutlined />}>Change Avatar</Button>
                  </Upload>
                </div>
                
                <div className="flex-1">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                      username: user?.username,
                      email: user?.email,
                      profileUrl: user?.profileUrl,
                    }}
                  >
                    <Form.Item
                      name="username"
                      label="Username"
                      rules={[
                        { required: true, message: 'Please input your username!' },
                        { min: 3, message: 'Username must be at least 3 characters' }
                      ]}
                    >
                      <Input prefix={<UserOutlined />} />
                    </Form.Item>
                    
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: 'Please input your email!' },
                        { type: 'email', message: 'Please enter a valid email' }
                      ]}
                    >
                      <Input prefix={<MailOutlined />} type="email" />
                    </Form.Item>
                    
                    <Form.Item name="profileUrl" hidden>
                      <Input />
                    </Form.Item>
                    
                    <Alert
                      message="Role cannot be changed"
                      description={`Your current role is: ${user?.role}. If you need to change your role, please contact an administrator.`}
                      type="info"
                      showIcon
                      className="mb-4"
                    />
                    
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        icon={<SaveOutlined />}
                      >
                        Save Changes
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              </div>
            </Card>
          </TabPane>
          
          <TabPane tab="Password" key="password">
            <Card>
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordChange}
              >
                <Form.Item
                  name="currentPassword"
                  label="Current Password"
                  rules={[{ required: true, message: 'Please input your current password!' }]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="newPassword"
                  label="New Password"
                  rules={[
                    { required: true, message: 'Please input your new password!' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="confirmPassword"
                  label="Confirm New Password"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Please confirm your new password!' },
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
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={passwordLoading}
                    icon={<LockOutlined />}
                  >
                    Change Password
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </TabPane>
          
          <TabPane tab="Preferences" key="preferences">
            <Card>
              <Form
                form={preferencesForm}
                layout="vertical"
                onFinish={handlePreferencesUpdate}
                initialValues={{
                  emailNotifications: true,
                  darkMode: false,
                  language: 'english',
                  visibility: 'public',
                  displayName: user?.username,
                  bio: '',
                }}
              >
                <h2 className="text-lg font-medium mb-4">Profile Settings</h2>
                
                <Form.Item
                  name="displayName"
                  label="Display Name"
                  extra="This is how your name will appear to other users"
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="bio"
                  label="Bio"
                  extra="Tell others about yourself (500 characters max)"
                >
                  <Input.TextArea 
                    rows={4} 
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
                
                <Form.Item
                  name="visibility"
                  label="Profile Visibility"
                >
                  <Select>
                    <Option value="public">Public - Anyone can view my profile</Option>
                    <Option value="registered">Registered Users - Only registered users can view my profile</Option>
                    <Option value="private">Private - Only I can view my profile</Option>
                  </Select>
                </Form.Item>
                
                <Divider />
                
                <h2 className="text-lg font-medium mb-4">Application Settings</h2>
                
                <Form.Item
                  name="emailNotifications"
                  label="Email Notifications"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name="language"
                  label="Language"
                >
                  <Select>
                    <Option value="english">English</Option>
                    <Option value="spanish">Spanish</Option>
                    <Option value="french">French</Option>
                    <Option value="german">German</Option>
                    <Option value="japanese">Japanese</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="darkMode"
                  label="Dark Mode"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name="autoplay3D"
                  label="Autoplay 3D Content"
                  valuePropName="checked"
                  extra="Automatically start 3D exhibitions when viewing"
                >
                  <Switch defaultChecked />
                </Form.Item>
                
                <Form.Item
                  name="highQuality"
                  label="High Quality Images"
                  valuePropName="checked"
                  extra="Load high resolution images (may use more data)"
                >
                  <Switch defaultChecked />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={preferencesLoading}
                    icon={<SaveOutlined />}
                  >
                    Save Preferences
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </TabPane>
          
          {user?.role === 'artist' && (
            <TabPane tab="Artist Settings" key="artist">
              <Card>
                <Form layout="vertical">
                  <h2 className="text-lg font-medium mb-4">Artist Profile Settings</h2>
                  
                  <Form.Item
                    name="artistName"
                    label="Artist Name"
                    extra="This can be different from your username"
                  >
                    <Input />
                  </Form.Item>
                  
                  <Form.Item
                    name="specialization"
                    label="Specialization"
                  >
                    <Select mode="multiple" placeholder="Select your specializations">
                      <Option value="painting">Painting</Option>
                      <Option value="photography">Photography</Option>
                      <Option value="sculpture">Sculpture</Option>
                      <Option value="digitalArt">Digital Art</Option>
                      <Option value="mixedMedia">Mixed Media</Option>
                      <Option value="installation">Installation</Option>
                      <Option value="conceptual">Conceptual Art</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    name="artistBio"
                    label="Artist Biography"
                    extra="Your artistic background, inspirations, and achievements"
                  >
                    <Input.TextArea 
                      rows={6} 
                      maxLength={1000}
                      showCount
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="websites"
                    label="Websites"
                    extra="Your personal website, portfolio, or social media links"
                  >
                    <Input.TextArea 
                      rows={3} 
                      placeholder="Add one link per line"
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="showcaseArtwork"
                    label="Featured Artwork"
                    extra="Select an artwork to feature on your profile"
                  >
                    <Select placeholder="Select an artwork">
                      <Option value="none">None</Option>
                      {/* This would be populated with the user's artworks */}
                      <Option value="artwork1">Artwork 1</Option>
                      <Option value="artwork2">Artwork 2</Option>
                    </Select>
                  </Form.Item>
                  
                  <Divider />
                  
                  <h2 className="text-lg font-medium mb-4">Exhibition Preferences</h2>
                  
                  <Form.Item
                    name="allowCuration"
                    label="Allow Curation"
                    valuePropName="checked"
                    extra="Allow curators to include your artwork in exhibitions"
                  >
                    <Switch defaultChecked />
                  </Form.Item>
                  
                  <Form.Item
                    name="artworkNotifications"
                    label="Artwork Notifications"
                    valuePropName="checked"
                    extra="Get notified when your artwork is featured in an exhibition"
                  >
                    <Switch defaultChecked />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      icon={<SaveOutlined />}
                    >
                      Save Artist Settings
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>
          )}
          
          {user?.role === 'curator' && (
            <TabPane tab="Curator Settings" key="curator">
              <Card>
                <Form layout="vertical">
                  <h2 className="text-lg font-medium mb-4">Curator Profile Settings</h2>
                  
                  <Form.Item
                    name="curatorName"
                    label="Curator Name"
                    extra="This can be different from your username"
                  >
                    <Input />
                  </Form.Item>
                  
                  <Form.Item
                    name="curatorBio"
                    label="Curator Biography"
                    extra="Your background, expertise, and curatorial approach"
                  >
                    <Input.TextArea 
                      rows={6} 
                      maxLength={1000}
                      showCount
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="institution"
                    label="Institution"
                    extra="Museum, gallery, or organization you're affiliated with"
                  >
                    <Input />
                  </Form.Item>
                  
                  <Form.Item
                    name="websites"
                    label="Websites"
                    extra="Your personal website, portfolio, or social media links"
                  >
                    <Input.TextArea 
                      rows={3} 
                      placeholder="Add one link per line"
                    />
                  </Form.Item>
                  
                  <Divider />
                  
                  <h2 className="text-lg font-medium mb-4">Exhibition Preferences</h2>
                  
                  <Form.Item
                    name="defaultExhibitionDuration"
                    label="Default Exhibition Duration (days)"
                    extra="Default duration for new exhibitions you create"
                  >
                    <Input type="number" defaultValue={30} min={1} max={365} />
                  </Form.Item>
                  
                  <Form.Item
                    name="exhibitionNotifications"
                    label="Exhibition Notifications"
                    valuePropName="checked"
                    extra="Get notified about exhibition engagements"
                  >
                    <Switch defaultChecked />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      icon={<SaveOutlined />}
                    >
                      Save Curator Settings
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>
          )}
          
          <TabPane tab="Privacy & Data" key="privacy">
            <Card>
              <h2 className="text-lg font-medium mb-4">Privacy Settings</h2>
              
              <Form layout="vertical">
                <Form.Item
                  name="profileIndexing"
                  label="Search Engine Indexing"
                  valuePropName="checked"
                  extra="Allow search engines to index your profile"
                >
                  <Switch defaultChecked />
                </Form.Item>
                
                <Form.Item
                  name="activityTracking"
                  label="Activity Tracking"
                  valuePropName="checked"
                  extra="Allow the platform to track your activity for personalized recommendations"
                >
                  <Switch defaultChecked />
                </Form.Item>
                
                <Divider />
                
                <h2 className="text-lg font-medium mb-4">Data Management</h2>
                
                <p className="mb-4">Here you can download all your data or delete your account.</p>
                
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => message.info('Your data is being prepared for download.')}>
                    Download My Data
                  </Button>
                  
                  <Button danger onClick={() => {
                    Modal.confirm({
                      title: 'Delete Account',
                      content: 'Are you sure you want to delete your account? This action cannot be undone.',
                      okText: 'Delete',
                      okButtonProps: { danger: true },
                      onOk: () => {
                        message.info('Account deletion request submitted. You will receive an email confirmation.');
                      }
                    });
                  }}>
                    Delete Account
                  </Button>
                </div>
              </Form>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default ProfileEdit;