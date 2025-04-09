'use client';

import React, { useEffect } from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';

const UnauthorizedPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuthContext();

  // Helper function to get dashboard URL by role
  const getDashboardByRole = (role: UserRole): string => {
    switch (role) {
      case UserRole.ARTIST:
        return '/dashboard/artist';
      case UserRole.CURATOR:
        return '/dashboard/curator';
      case UserRole.ADMIN:
        return '/dashboard/admin';
      default:
        return '/';
    }
  };

  // Ensure user sees appropriate content based on authentication state
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // If not logged in, redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.replace(`/auth/login?redirectTo=${returnUrl}`);
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Result
        status="403"
        title="Access Denied"
        subTitle={
          isAuthenticated
            ? `You don't have permission to access this page. Your current role is ${user?.role}.`
            : "Please log in to access this resource."
        }
        extra={[
          <Button 
            type="primary" 
            key="home" 
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>,
          isAuthenticated && user && (
            <Button 
              key="dashboard" 
              onClick={() => router.push(getDashboardByRole(user.role))}
            >
              Go to My Dashboard
            </Button>
          ),
          !isAuthenticated && (
            <Button 
              key="login" 
              onClick={() => router.push('/auth/login')}
            >
              Log In
            </Button>
          )
        ].filter(Boolean)}
      />
    </div>
  );
};

export default UnauthorizedPage;