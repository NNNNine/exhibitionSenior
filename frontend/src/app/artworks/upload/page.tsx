'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, message } from 'antd';
import { ProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import ArtworkUploadForm from '@/components/artwork/ArtworkUploadForm';
import { createArtwork } from '@/lib/api';

const ArtworkUploadPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const artwork = await createArtwork(formData);
      message.success('Artwork submitted successfully!');
      
      // Redirect to artwork detail page
      router.push(`/artworks/${artwork.id}`);
    } catch (error: any) {
      message.error(error.message || 'Failed to upload artwork');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={[UserRole.ARTIST]}>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Upload New Artwork</h1>
        
        <Card>
          <ArtworkUploadForm onSubmit={handleSubmit} loading={loading} />
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ArtworkUploadPage;