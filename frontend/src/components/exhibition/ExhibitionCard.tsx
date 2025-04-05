import React from 'react';
import { Card, Tag, Avatar, Button } from 'antd';
import { EnvironmentOutlined, UserOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { Exhibition } from '@/types/exhibition.types';
import { formatDate } from '@/utils/format';

const { Meta } = Card;

interface ExhibitionCardProps {
  exhibition: Exhibition;
  onClick?: (exhibition: Exhibition) => void;
  showCurator?: boolean;
  showActions?: boolean;
}

const ExhibitionCard: React.FC<ExhibitionCardProps> = ({
  exhibition,
  onClick,
  showCurator = true,
  showActions = true,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick(exhibition);
    } else {
      router.push(`/exhibitions/${exhibition.id}`);
    }
  };

  // Define actions if showActions is true
  const actions = showActions
    ? [
        <Button 
          key="enter" 
          type="primary" 
          icon={<EyeOutlined />} 
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/exhibitions/${exhibition.id}`);
          }}
        >
          Enter
        </Button>
      ]
    : undefined;

  return (
    <Card
      hoverable
      onClick={handleClick}
      cover={
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <EnvironmentOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
        </div>
      }
      actions={actions}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <Tag color={exhibition.isActive ? 'green' : 'orange'}>
          {exhibition.isActive ? 'Active' : 'Coming Soon'}
        </Tag>
        {showCurator && exhibition.curator && (
          <div className="flex items-center">
            <Avatar 
              size="small" 
              icon={<UserOutlined />} 
              src={exhibition.curator.profileUrl}
              className="mr-1"
            />
            <span className="text-xs text-gray-500">
              {exhibition.curator.username}
            </span>
          </div>
        )}
      </div>
      
      <Meta
        title={exhibition.title}
        description={
          <div>
            <p className="text-gray-500 line-clamp-2 mb-2">
              {exhibition.description}
            </p>
            <div className="flex items-center text-xs text-gray-400">
              <CalendarOutlined className="mr-1" />
              <span>
                {formatDate(exhibition.startDate, { month: 'short', day: 'numeric', year: 'numeric' })} - 
                {formatDate(exhibition.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default ExhibitionCard;