'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Space, Drawer } from 'antd';
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
  DashboardOutlined
} from '@ant-design/icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';

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
    return '';
  };

  // Memoize menu items to prevent unnecessary re-renders
  const menuItems = useMemo(() => {
    const baseItems = [
      {
        key: 'home',
        label: <Link href="/" style={{ color: '#1890ff' }}>Home</Link>,
        icon: <HomeOutlined />,
      },
      {
        key: 'artworks',
        label: <Link href="/artworks" style={{ color: '#1890ff' }}>Artworks</Link>,
        icon: <PictureOutlined />,
      },
      {
        key: 'exhibitions',
        label: <Link href="/exhibitions" style={{ color: '#1890ff' }}>Exhibitions</Link>,
        icon: <EnvironmentOutlined />,
      },
    ];

    // Add role-specific items if authenticated
    if (isAuthenticated && user) {
      if (user.role === UserRole.ARTIST) {
        baseItems.push({
          key: 'artist',
          label: <Link href="/artist">Artist Dashboard</Link>,
          icon: <DashboardOutlined />,
        });
        baseItems.push({
          key: 'upload',
          label: <Link href="/artworks/upload">Upload Artwork</Link>,
          icon: <PlusOutlined />,
        });
      } else if (user.role === UserRole.CURATOR) {
        baseItems.push({
          key: 'curator',
          label: <Link href="/curator">Curator Dashboard</Link>,
          icon: <DashboardOutlined />,
        });
        baseItems.push({
          key: 'create-exhibition',
          label: <Link href="/exhibitions/create">Create Exhibition</Link>,
          icon: <PlusOutlined />,
        });
      } else if (user.role === UserRole.ADMIN) {
        baseItems.push({
          key: 'admin',
          label: <Link href="/admin">Admin Dashboard</Link>,
          icon: <DashboardOutlined />,
        });
      }
    }

    return baseItems;
  }, [isAuthenticated, user]);

  // User menu items
  const userMenuItems = useMemo(() => [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => router.push(`/profile/${user?.username}`),
    },
    {
      key: 'dashboard',
      label: user?.role === UserRole.ARTIST 
        ? 'Artist Dashboard' 
        : user?.role === UserRole.CURATOR
        ? 'Curator Dashboard'
        : 'Dashboard',
      icon: <DashboardOutlined />,
      onClick: () => {
        if (user?.role === UserRole.ARTIST) {
          router.push('/artist');
        } else if (user?.role === UserRole.CURATOR) {
          router.push('/curator');
        } else if (user?.role === UserRole.ADMIN) {
          router.push('/admin');
        } else {
          router.push('/profile');
        }
      },
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: () => logout(),
    },
  ], [user, logout, router]);

  // Prevent hydration errors by rendering nothing on initial server-side render
  if (!isClient) {
    return null;
  }

  return (
    <AntLayout className="min-h-screen">
      {/* Header */}
      <Header className="bg-white shadow-md flex items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-blue-600 mr-4">
              Exhibition Art Online
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-4">
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Menu
              mode="horizontal"
              selectedKeys={[getSelectedKey()]}
              items={menuItems}
              className="border-0 flex items-center"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: 'none',
                backgroundColor: 'transparent',
              }}
            />
          </div>

          {/* User Menu / Login Button */}
            <div className="flex items-center">
            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="link" className="flex items-center">
                <Avatar
                size="small"
                icon={<UserOutlined />}
                src={user?.profileUrl}
                className="mr-2"
                />
                <span className="hidden sm:inline">{user?.username}</span>
              </Button>
              </Dropdown>
            ) : (
              <Space>
              <Button
                type="link"
                icon={<LoginOutlined />}
                onClick={() => router.push('/auth/login')}
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
              className="ml-2 md:hidden"
              style={{ color: '#fff' }}
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
            ...menuItems, 
            ...(isAuthenticated ? [
              { type: 'divider' as const },
              ...userMenuItems
            ] : [])
          ]}
          style={{ borderRight: 0 }}
          onClick={() => setMobileMenuOpen(false)}
        />

        {isAuthenticated && (
          <>
            <div className="p-4 border-t">
              <p className="text-gray-500 mb-2">User Menu</p>
              <Menu
                mode="vertical"
                items={userMenuItems}
                style={{ borderRight: 0 }}
                onClick={() => setMobileMenuOpen(false)}
              />
            </div>
          </>
        )}
      </Drawer>

      {/* Main Content */}
      <Content className="bg-gray-50">
        {children}
      </Content>

      {/* Footer */}
      <Footer className="text-center bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-left">
            <div>
              <h3 className="text-lg font-bold mb-3">Exhibition Art Online</h3>
              <p className="text-gray-400">
                A platform for experiencing art exhibitions in an immersive 3D environment.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/exhibitions" className="text-gray-400 hover:text-white">
                    Exhibitions
                  </Link>
                </li>
                <li>
                  <Link href="/artworks" className="text-gray-400 hover:text-white">
                    Artworks
                  </Link>
                </li>
                <li>
                  <Link href="/register?role=artist" className="text-gray-400 hover:text-white">
                    Join as Artist
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3">Contact</h3>
              <p className="text-gray-400">
                Have questions? Feel free to reach out to us.
              </p>
              <Link href="mailto:contact@exhibitionartonline.com" className="text-gray-400 hover:text-white">
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