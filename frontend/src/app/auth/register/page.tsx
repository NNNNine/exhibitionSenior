'use client';

import { useState } from 'react';
import { Form, Input, Button, Select, message, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, GoogleOutlined, FacebookOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import Link from 'next/link';
// import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';

const { Option } = Select;

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export default function Register() {
  const [loading, setLoading] = useState<boolean>(false);
  const { register } = useAuthContext();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // const router = useRouter();
  const [form] = Form.useForm();

  const onFinish = async (values: RegisterFormValues) => {
    const { username, email, password, role } = values;
    
    setLoading(true);
    try {
      await register(username, email, password, role);
      setSuccessMessage('Registration successful!');
      // Redirection is handled in the register function based on user role
    } catch (error: unknown) {
      console.error('Registration error:', error);
      setErrorMessage(error instanceof Error
        ? error.message
        : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Error Message */}
      {errorMessage && (
        <Alert
          message="Error"
          description={errorMessage}
          type="error"
          showIcon
          // className="mb-6"
          style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }} 
          closable
          onClose={() => setErrorMessage(null)}
        />
      )}

      {successMessage && (
        <Alert 
          message="Success" 
          description={successMessage} 
          type="success" 
          showIcon 
          // className="mb-4"
          style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }} 
          closable
          onClose={() => setSuccessMessage(null)}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Form
          form={form}
          name="register"
          className="mt-8 space-y-6"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Please input your username!' },
              { min: 3, message: 'Username must be at least 3 characters' }
            ]}
          >
            <Input 
              prefix={<UserOutlined className="site-form-item-icon" />} 
              placeholder="Username"
              size="large"
              style={{ borderRadius: '0.375rem' }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input 
              prefix={<MailOutlined className="site-form-item-icon" />} 
              placeholder="Email address"
              size="large"
              style={{ borderRadius: '0.375rem' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Password"
              size="large"
              style={{ borderRadius: '0.375rem' }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Confirm password"
              size="large"
              style={{ borderRadius: '0.375rem' }}
            />
          </Form.Item>

          <Form.Item
            name="role"
            rules={[{ required: true, message: 'Please select your role!' }]}
          >
            <Select
              placeholder="Select your role"
              size="large"
              style={{ borderRadius: '0.375rem' }}
            >
              <Option value={UserRole.VISITOR}>Visitor</Option>
              <Option value={UserRole.ARTIST}>Artist</Option>
            </Select>
          </Form.Item>

          <div>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              style={{ width: '100%' }}
            >
              Create Account
            </Button>
          </div>
        </Form>

        <Divider>Or register with</Divider>

        <div className="grid grid-cols-2 gap-4">
          <Button
            icon={<GoogleOutlined />}
            size="large"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => message.info('Google authentication coming soon')}
          >
            Google
          </Button>

          <Button
            icon={<FacebookOutlined />}
            size="large"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => message.info('Facebook authentication coming soon')}
          >
            Facebook
          </Button>
        </div>
      </motion.div>
    </div>
  );
}