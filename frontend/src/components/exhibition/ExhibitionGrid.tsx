import React from 'react';
import { Empty, Spin } from 'antd';
import ExhibitionCard from './ExhibitionCard';
import { Exhibition } from '@/types/exhibition.types';

interface ExhibitionGridProps {
  exhibitions: Exhibition[];
  loading?: boolean;
  onExhibitionClick?: (exhibition: Exhibition) => void;
  showCurator?: boolean;
  showActions?: boolean;
  emptyText?: string;
  columns?: number;
}

const ExhibitionGrid: React.FC<ExhibitionGridProps> = ({
  exhibitions,
  loading = false,
  onExhibitionClick,
  showCurator = true,
  showActions = true,
  emptyText = 'No exhibitions found',
  columns = 3,
}) => {
  // Calculate column class based on columns prop
  const getColumnClass = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!exhibitions || exhibitions.length === 0) {
    return <Empty description={emptyText} />;
  }

  return (
    <div className={`grid ${getColumnClass()} gap-6`}>
      {exhibitions.map((exhibition) => (
        <div key={exhibition.id} className="h-full">
          <ExhibitionCard
            exhibition={exhibition}
            onClick={onExhibitionClick}
            showCurator={showCurator}
            showActions={showActions}
          />
        </div>
      ))}
    </div>
  );
};

export default ExhibitionGrid;