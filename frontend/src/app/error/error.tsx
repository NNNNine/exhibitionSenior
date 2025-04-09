'use client';

import React, { useEffect } from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled error:', error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Result
        status="500"
        title="Something Went Wrong"
        subTitle="Sorry, an unexpected error has occurred."
        extra={[
          <Button 
            type="primary" 
            key="tryAgain" 
            onClick={() => reset()}
          >
            Try Again
          </Button>,
          <Button 
            key="home" 
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        ]}
      />
    </div>
  );
}