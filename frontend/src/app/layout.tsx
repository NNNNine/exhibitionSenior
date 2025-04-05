import React from 'react';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import '@/styles/globals.css';

// Configure font
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Exhibition Art Online',
  description: 'Experience art exhibitions in an immersive 3D environment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1677ff',
              borderRadius: 6,
            },
            components: {
              Button: {
                borderRadius: 4,
              },
              Card: {
                borderRadius: 8,
              },
              Menu: {
                borderRadius: 4,
              },
            },
          }}
        >
          <AuthProvider>
            <Layout>{children}</Layout>
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
