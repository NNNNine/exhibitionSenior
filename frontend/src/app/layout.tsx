import React from 'react';
import { Inter } from 'next/font/google';
import { ConfigProvider, App } from 'antd';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
// import RouteProtectionProvider from '@/contexts/RouteProtectionContext';
import Layout from '@/components/layout/Layout';
import '@/styles/globals.css';
import '@ant-design/v5-patch-for-react-19';

// Configure font
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata = {
  title: 'Exhibition Art Online',
  description: 'Experience art exhibitions in an immersive 3D environment',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Customize theme to match the luxury dark theme design requirements
  const theme = {
    token: {
      colorPrimary: '#6366f1', // Indigo as primary color
      colorSuccess: '#10b981', // Emerald green
      colorWarning: '#f59e0b', // Amber
      colorError: '#ef4444',   // Red
      colorInfo: '#3b82f6',    // Blue
      
      // Base styling
      borderRadius: 6,
      wireframe: false,
      
      // Font settings
      fontFamily: inter.style.fontFamily,
      fontSize: 14,
      
      // Color system
      colorBgBase: '#ffffff',
      colorTextBase: '#1f2937', // Gray-800
      
      // Animation
      motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      motionDurationMid: '0.2s',
    },
    
    // Component-specific overrides
    components: {
      Button: {
        colorPrimary: '#6366f1',
        borderRadius: 4,
        algorithm: true,
      },
      Card: {
        borderRadius: 8,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        algorithm: true,
      },
      Menu: {
        itemSelectedBg: 'rgba(99, 102, 241, 0.1)',
        itemSelectedColor: '#6366f1',
        itemHoverColor: '#818cf8',
        borderRadius: 4,
        algorithm: true,
      },
      Layout: {
        headerBg: '#111827', // Gray-900 for header
        bodyBg: '#f9fafb',   // Gray-50 for content
        footerBg: '#111827', // Gray-900 for footer
      },
      Typography: {
        colorTextHeading: '#111827',
        fontWeightStrong: 600,
      },
      Modal: {
        borderRadius: 8,
      },
      Dropdown: {
        borderRadius: 6,
        controlItemBgHover: 'rgba(99, 102, 241, 0.1)',
      },
      Avatar: {
        borderRadius: 6,
      },
      Image: {
        borderRadius: 8,
      },
    },
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111827" />
        <link rel="icon" href="/images/icon.ico" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <ConfigProvider theme={theme}>
          <App>
            <AuthProvider>
              
                <NotificationProvider>
                  <Layout>{children}</Layout>
                </NotificationProvider>
              
            </AuthProvider>
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}