'use client';

import { useState } from 'react';
import { Form, Input, Button, message, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api/auth';

interface ForgotPasswordFormValues {
  email: string;
}

export default function ForgotPassword() {
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const onFinish = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      await forgotPassword(values.email);
      setSubmitted(true);
    } catch (error) {
      console.error('Error requesting password reset:', error);
      message.error('Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg"
        >
          <Result
            status="success"
            title="Reset link sent!"
            subTitle="If an account exists with that email, we've sent password reset instructions to your email address."
            extra={[
              <Link href="/login" key="login">
                <Button type="primary">Back to login</Button>
              </Link>,
            ]}
          />
        </motion.div>
      </div>
    );
  }

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
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>

        <Form
          name="forgotPassword"
          className="mt-8 space-y-6"
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
              prefix={<MailOutlined className="site-form-item-icon" />} 
              placeholder="Email address"
              size="large"
              className="rounded-md"
            />
          </Form.Item>

          <div>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              className="w-full"
            >
              Send reset link
            </Button>
          </div>

          <div className="text-center mt-4">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Back to login
            </Link>
          </div>
        </Form>
      </motion.div>
    </div>
  );
}