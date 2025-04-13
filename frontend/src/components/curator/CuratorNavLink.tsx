import React from 'react';
import Link from 'next/link';
import { Menu } from 'antd';
import { 
  DashboardOutlined, 
  PictureOutlined, 
  UserOutlined, 
  LayoutOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { usePathname } from 'next/navigation';

type MenuItem = {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
};

const CuratorNavLinks: React.FC = () => {
  const pathname = usePathname();

  const getSelectedKey = () => {
    if (pathname?.includes('/curator/manage/user')) return 'manage-users';
    if (pathname?.includes('/curator/manage/artwork')) return 'manage-artworks';
    if (pathname?.includes('/curator/layout')) return 'layout-editor';
    if (pathname?.includes('/dashboard/curator')) return 'dashboard';
    return '';
  };

  const menuItems: MenuItem[] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard/curator">Dashboard</Link>,
    },
    {
      key: 'manage-artworks',
      icon: <PictureOutlined />,
      label: <Link href="/curator/manage/artwork">Manage Artworks</Link>,
    },
    {
      key: 'manage-users',
      icon: <UserOutlined />,
      label: <Link href="/curator/manage/user">Manage Users</Link>,
    },
    {
      key: 'layout-editor',
      icon: <LayoutOutlined />,
      label: <Link href="/curator/layout">Layout Editor</Link>
    },
    {
      key: 'approvals',
      icon: <AppstoreOutlined />,
      label: <Link href="/curator/approvals">Pending Approvals</Link>
    }
  ];

  return (
    <Menu
      mode="horizontal"
      selectedKeys={[getSelectedKey()]}
      items={menuItems}
      className="curator-nav"
      style={{ marginBottom: '1.5rem' }}
    />
  );
};

export default CuratorNavLinks;