'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Alert } from 'antd';
import { withProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import ArtworkUploadForm from '@/components/artwork/ArtworkUploadForm';
import { createArtwork } from '@/lib/api/index';

const ArtworkUploadPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const artwork = await createArtwork(formData);
      setSuccessMessage('Artwork submitted successfully!');
      
      // Redirect to artwork detail page
      router.push(`/artworks/${artwork.id}`);
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
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Upload New Artwork</h1>
      
      <Card>
        <ArtworkUploadForm onSubmit={handleSubmit} loading={loading} />
        
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

        {successMessage && (
          <Alert 
            message="Success" 
            description={successMessage} 
            type="success" 
            showIcon 
            className="mb-4" 
            closable
            onClose={() => setSuccessMessage(null)}
          />
        )}

      </Card>
    </div>
  );
};

export default withProtectedRoute(ArtworkUploadPage, {
  requiredRoles: [UserRole.ARTIST],
  redirectTo: '/unauthorized',
})