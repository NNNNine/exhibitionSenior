'use client';

import React from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Result
        status="404"
        title="Page Not Found"
        subTitle="Sorry, the page you visited does not exist."
        extra={[
          <Button 
            type="primary" 
            key="home" 
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>,
          <Button 
            key="back" 
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        ]}
      />
    </div>
  );
}