'use client';

import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Checkbox, 
  message, 
  Divider,
  Alert 
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  GoogleOutlined, 
  FacebookOutlined 
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { login, user } = useAuthContext();
  const router = useRouter();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Login successful!');
      // Redirection is handled in the login function based on user role
      if (user) {
        switch (user.role) {
          case UserRole.ARTIST:
            router.push('/artist/dashboard');
            break;
          case UserRole.CURATOR:
            router.push('/curator/dashboard');
            break;
          case UserRole.ADMIN:
            router.push('/admin/dashboard');
            break;
          default:
            router.push('/');
        }
      }  

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to upload artwork');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/register" className="font-medium text-violet-600 hover:text-violet-500">
              create a new account
            </Link>
          </p>
        </div>

        <Form<LoginFormValues>
          name="login"
          className="mt-8 space-y-6"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input 
              prefix={<UserOutlined className="site-form-item-icon" />} 
              placeholder="Email address"
              size="large"
              style={{ borderRadius: '0.375rem' }} // Tailwind CSS rounded-md
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Password"
              size="large"
              style={{ borderRadius: '0.375rem' }} // Tailwind CSS rounded-md
            />
          </Form.Item>

          <div className="flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>

            <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </div>

          <div>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              style={{ width: '100%' }}
            >
              Sign in
            </Button>
          </div>
        </Form>

        <Divider>Or sign in with</Divider>

        <div className="flex grid grid-cols-2 gap-4">
          <Button
            icon={<GoogleOutlined />}
            size="large"
            // className="flex items-center justify-center"
            style={{ justifyContent: 'center', alignItems: 'center' }}
            onClick={() => message.info('Google authentication coming soon')}
          >
            Google
          </Button>

          <Button
            icon={<FacebookOutlined />}
            size="large"
            // className="flex items-center justify-center"
            style={{ justifyContent: 'center', alignItems: 'center' }}
            onClick={() => message.info('Facebook authentication coming soon')}
          >
            Facebook
          </Button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-6"
        />
      )}
    </div>
  );
}