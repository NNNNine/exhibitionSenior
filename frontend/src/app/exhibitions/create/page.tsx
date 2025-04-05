'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, message } from 'antd';
import { ProtectedRoute } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';
import ExhibitionCreateForm from '@/components/exhibition/ExhibitionCreateForm';
import { ExhibitionCreateData } from '@/types/exhibition.types';
import { createExhibition } from '@/lib/api/index';

const ExhibitionCreatePage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ExhibitionCreateData) => {
    setLoading(true);
    try {
      const exhibition = await createExhibition(data);
      message.success('Exhibition created successfully!');
      
      // Redirect to exhibition detail page
      router.push(`/exhibitions/${exhibition.id}`);
    } catch (error: any) {
      message.error(error.message || 'Failed to create exhibition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={[UserRole.CURATOR, UserRole.ADMIN]}>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Create New Exhibition</h1>
        
        <Card>
          <ExhibitionCreateForm onSubmit={handleSubmit} loading={loading} />
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ExhibitionCreatePage;