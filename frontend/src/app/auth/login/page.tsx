'use client';

import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Checkbox, 
  message, 
  Divider 
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

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuthContext();
  const router = useRouter();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Login successful!');
      // Redirection is handled in the login function based on user role
    } catch (error) {
      console.error('Login error:', error);
      message.error(
        error instanceof Error 
          ? error.message 
          : 'Login failed. Please check your credentials.'
      );
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
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
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
              className="rounded-md"
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
              className="rounded-md"
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
              className="w-full"
            >
              Sign in
            </Button>
          </div>
        </Form>

        <Divider>Or sign in with</Divider>

        <div className="grid grid-cols-2 gap-4">
          <Button
            icon={<GoogleOutlined />}
            size="large"
            className="flex items-center justify-center"
            onClick={() => message.info('Google authentication coming soon')}
          >
            Google
          </Button>

          <Button
            icon={<FacebookOutlined />}
            size="large"
            className="flex items-center justify-center"
            onClick={() => message.info('Facebook authentication coming soon')}
          >
            Facebook
          </Button>
        </div>
      </motion.div>
    </div>
  );
}