'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Space, Drawer, Badge } from 'antd';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  HomeOutlined,
  PictureOutlined,
  EnvironmentOutlined,
  MenuOutlined,
  PlusOutlined,
  DashboardOutlined,
  BellOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAuthContext } from '@/contexts/AuthContext';
import NotificationDropdown from '@/components/notification/NotificationDropdown';
import { UserRole } from '@/types/user.types';
import { useNotifications } from '@/contexts/NotificationContext';

const { Header, Content, Footer } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeExhibition, setActiveExhibition] = useState(false);
  
  // Use the notifications context instead of direct API calls
  const { unreadCount } = useNotifications();

  // Simulate an active exhibition notification
  useEffect(() => {
    // In a real app, this would come from an API call or context
    setActiveExhibition(true);
  }, []);

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get current selected menu item based on pathname
  const getSelectedKey = () => {
    if (!pathname) return 'home';
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/artworks')) return 'artworks';
    if (pathname.startsWith('/exhibitions')) return 'exhibitions';
    if (pathname.startsWith('/artist')) return 'artist';
    if (pathname.startsWith('/curator')) return 'curator';
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/metaverse')) return 'metaverse';
    return '';
  };

  // Role-specific navigation items
  const getRoleSpecificItems = () => {
    if (!isAuthenticated || !user) return [];
    
    switch (user.role) {
      case UserRole.ARTIST:
        return [
          {
            key: 'artist',
            label: <Link href="/dashboard/artist">Artist Dashboard</Link>,
            icon: <DashboardOutlined />,
          },
          {
            key: 'upload',
            label: <Link href="/artworks/upload">Upload Artwork</Link>,
            icon: <PlusOutlined />,
          }
        ];
      case UserRole.CURATOR:
        return [
          {
            key: 'curator',
            label: <Link href="/dashboard/curator">Curator Dashboard</Link>,
            icon: <DashboardOutlined />,
          },
          {
            key: 'create-exhibition',
            label: <Link href="/exhibitions/create">Create Exhibition</Link>,
            icon: <PlusOutlined />,
          },
          {
            key: 'pending-approvals',
            label: <Link href="/curator/approvals">Pending Approvals</Link>,
            icon: <AppstoreOutlined />,
          }
        ];
      default:
        return [];
    }
  };

  // Main navigation items (simplified for navbar)
  const mainNavItems = useMemo(() => [
    {
      key: 'home',
      label: <Link href="/">Home</Link>,
      icon: <HomeOutlined />,
    },
    {
      key: 'artworks',
      label: <Link href="/artworks">Artworks</Link>,
      icon: <PictureOutlined />,
    },
    {
      key: 'exhibition',
      label: <Link href="/metaverse/view">Exhibition</Link>,
      icon: <EnvironmentOutlined />,
    },
  ], [activeExhibition]);
  
  // Full menu items for drawer (includes role-specific items)
  const allMenuItems = useMemo(() => {
    const baseItems = [...mainNavItems];
    
    // Add role-specific items if authenticated
    if (isAuthenticated && user) {
      return [...baseItems, ...getRoleSpecificItems()];
    }
    
    return baseItems;
  }, [mainNavItems, isAuthenticated, user]);

  // User menu items
  const userMenuItems = useMemo(() => [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => router.push(`/profile/${user?.username}`),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: <Badge count={unreadCount}><BellOutlined /></Badge>,
      onClick: () => router.push('/notifications'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: () => logout(),
    },
  ], [user, logout, router, unreadCount]);

  // Prevent hydration errors by rendering nothing on initial server-side render
  if (!isClient) {
    return null;
  }

  return (
    <AntLayout className="min-h-screen flex flex-col">
      {/* Header */}
      <Header className="bg-gray-900 flex items-center justify-between px-4 md:px-6 h-16 sticky top-0 z-50">
        {/* Logo */}
        <div className="flex-none items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-white mr-4">
              Exhibition Art Online
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-4">
          {/* Desktop Navigation - Simplified main items only */}
          <div className="hidden md:block">
            <Menu
              mode="horizontal"
              selectedKeys={[getSelectedKey()]}
              items={mainNavItems}
              style={{ 
                width: '100%',
                margin: 50,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'white'
              }}
              theme="dark"
            />
          </div>

          {/* User Menu / Login Button */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <>
                {/* Notifications Dropdown */}
                <div className="md:block mr-4">
                  <NotificationDropdown />
                </div>
                
                {/* User Dropdown */}
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                  <Button 
                  type="text" 
                  style={{ display: 'flex', alignItems: 'center', color: 'white' }}
                  >
                    <Avatar
                      size="small"
                      icon={<UserOutlined />}
                      src={user?.profileUrl}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span className="sm:inline">{user?.username}</span>
                  </Button>
                </Dropdown>
              </>
            ) : (
              <Space>
                <Button
                  type="link"
                  icon={<LoginOutlined />}
                  onClick={() => router.push('/auth/login')}
                  style={{ color: 'white' }}
                >
                  Log in
                </Button>
                <Button
                  type="primary"
                  onClick={() => router.push('/auth/register')}
                >
                  Register
                </Button>
              </Space>
            )}

            {/* Mobile Menu Button */}
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden"
              style={{ color: '#fff', marginLeft: '0.5rem' }}
            />
          </div>
        </div>
      </Header>

      {/* Mobile Menu Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="vertical"
          selectedKeys={[getSelectedKey()]}
          items={[
            ...allMenuItems, 
            ...(isAuthenticated ? [
              { type: 'divider' as const },
              ...userMenuItems
            ] : [
              { type: 'divider' as const },
              {
                key: 'login',
                label: 'Log in',
                icon: <LoginOutlined />,
                onClick: () => {
                  router.push('/auth/login');
                  setMobileMenuOpen(false);
                }
              },
              {
                key: 'register',
                label: 'Register',
                icon: <UserOutlined />,
                onClick: () => {
                  router.push('/auth/register');
                  setMobileMenuOpen(false);
                }
              }
            ])
          ]}
          style={{ borderRight: 0 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      </Drawer>

      {/* Main Content */}
      <Content className="bg-gray-50 flex-grow">
        {children}
      </Content>

      {/* Footer */}
      <Footer style={{
        textAlign: 'center',
        backgroundColor: '#111827',
        color: 'white',
        paddingTop: '2rem',
        paddingBottom: '2rem'
      }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-left">
            <div>
              <h3 className="text-zinc-300 text-lg font-bold mb-3">Exhibition Art Online</h3>
              <p className="text-gray-400">
                A platform for experiencing art exhibitions in an immersive 3D environment.
              </p>
            </div>
            <div>
              <h3 className="text-zinc-300 text-lg font-bold mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/metaverse/view" 
                    style={{ color: '#9CA3AF', textDecoration: 'none' }} 
                    onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'gray'}
                  >
                    Exhibition
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/artworks" 
                    style={{ color: '#9CA3AF', textDecoration: 'none' }} 
                    onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'gray'}
                  >
                    Artworks
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/auth/register?role=artist" 
                    style={{ color: '#9CA3AF', textDecoration: 'none' }} 
                    onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'gray'}
                  >
                    Join as Artist
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-zinc-300 text-lg font-bold mb-3">Contact</h3>
              <p className="text-gray-400">
                Have questions? Feel free to reach out to us.
              </p>
              <Link 
                href="mailto:contact@exhibitionartonline.com" 
                style={{ color: '#9CA3AF', textDecoration: 'none' }} 
                onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                onMouseOut={(e) => e.currentTarget.style.color = 'gray'}
              >
                contact@exhibitionartonline.com
              </Link>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-700 text-center text-gray-500">
            &copy; {new Date().getFullYear()} Exhibition Art Online. All rights reserved.
          </div>
        </div>
      </Footer>
    </AntLayout>
  );
};

export default Layout;