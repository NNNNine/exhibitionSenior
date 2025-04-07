'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Input, 
  Select, 
  Button, 
  Pagination, 
  Tag, 
  Spin, 
  Empty, 
  Divider,
  Switch,
  Radio,
  Alert,
  Tabs,
  DatePicker
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  CalendarOutlined, 
  EnvironmentOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { getExhibitions } from '@/lib/api';
import { Exhibition } from '@/types/exhibition.types';
import ExhibitionGrid from '@/components/exhibition/ExhibitionGrid';
import { formatDate } from '@/utils/format';
import moment from 'moment';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ExhibitionsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse query parameters
  const initialSearch = searchParams.get('search') || '';
  const initialActive = searchParams.get('active') === 'true';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  
  // State for exhibitions and pagination
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalExhibitions, setTotalExhibitions] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(9);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [isActive, setIsActive] = useState<boolean | undefined>(initialActive ? true : undefined);
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // Function to update URL with current filters
  const updateQueryParams = (params: Record<string, string | number | boolean | null>) => {
    const url = new URL(window.location.href);
    
    // Update/add new parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      } else {
        url.searchParams.delete(key);
      }
    });
    
    // Replace current URL without reloading the page
    window.history.pushState({}, '', url.toString());
  };
  
  // Fetch exhibitions with current filters
  const fetchExhibitions = async (page: number = currentPage) => {
    setLoading(true);
    setError(null);
    
    try {
      // Construct query parameters
      const params: any = {
        page,
        limit: pageSize,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (isActive !== undefined) params.isActive = isActive;
      
      // Add date range filter if selected
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      
      // Sort order
      switch (sortBy) {
        case 'oldest':
          params.sort = 'startDate';
          params.order = 'asc';
          break;
        case 'title_asc':
          params.sort = 'title';
          params.order = 'asc';
          break;
        case 'title_desc':
          params.sort = 'title';
          params.order = 'desc';
          break;
        case 'newest':
        default:
          params.sort = 'startDate';
          params.order = 'desc';
          break;
      }
      
      const { exhibitions: fetchedExhibitions, pagination } = await getExhibitions(params);
      
      setExhibitions(fetchedExhibitions);
      setTotalExhibitions(pagination.total);
      setCurrentPage(pagination.page);
      
      // Update URL with current filters
      updateQueryParams({
        search: searchQuery || null,
        active: isActive === undefined ? null : isActive,
        page: page === 1 ? null : page,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search input
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on new search
  };
  
  // Handle active filter change
  const handleActiveChange = (value: string) => {
    switch (value) {
      case 'active':
        setIsActive(true);
        break;
      case 'upcoming':
        setIsActive(false);
        break;
      case 'all':
      default:
        setIsActive(undefined);
        break;
    }
    setCurrentPage(1); // Reset to first page on new filter
  };
  
  // Handle date range change
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    setCurrentPage(1); // Reset to first page on new filter
  };
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
    fetchExhibitions(currentPage);
  };
  
  // Handle pagination change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchExhibitions(page);
    
    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    fetchExhibitions(1);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setIsActive(undefined);
    setDateRange(null);
    setSortBy('newest');
    setSelectedTab('all');
    setCurrentPage(1);
    
    // Clear URL parameters
    updateQueryParams({
      search: null,
      active: null,
      page: null,
    });
    
    fetchExhibitions(1);
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    handleActiveChange(tab);
  };
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchExhibitions(initialPage);
    
    // Set initial tab based on active filter
    if (initialActive) {
      setSelectedTab('active');
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Exhibitions</h1>
        <p className="text-gray-500">
          Explore curated art exhibitions in an immersive 3D environment
        </p>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <Search
          placeholder="Search exhibitions by title or description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          enterButton
          size="large"
        />
      </div>
      
      {/* Filter Tabs */}
      <div className="mb-6">
        <Tabs
          activeKey={selectedTab}
          onChange={handleTabChange}
          className="mb-4"
          items={[
            {
              key: 'all',
              label: 'All Exhibitions'
            },
            {
              key: 'active',
              label: 'Current Exhibitions'
            },
            {
              key: 'upcoming',
              label: 'Upcoming Exhibitions'
            }
          ]}
        />
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-grow sm:flex-grow-0 min-w-[250px]">
            <RangePicker
              value={dateRange as any}
              onChange={handleDateRangeChange}
              placeholder={['Start Date', 'End Date']}
              className="w-full"
            />
          </div>
          
          <div className="flex-grow sm:flex-grow-0 min-w-[200px]">
            <Select
              value={sortBy}
              onChange={handleSortChange}
              style={{ width: '100%' }}
              placeholder="Sort by"
            >
              <Option value="newest">Newest First</Option>
              <Option value="oldest">Oldest First</Option>
              <Option value="title_asc">Title A-Z</Option>
              <Option value="title_desc">Title Z-A</Option>
            </Select>
          </div>
          
          <Button 
            type="primary"
            onClick={applyFilters}
            icon={<FilterOutlined />}
          >
            Apply Filters
          </Button>
          
          <Button 
            onClick={resetFilters}
          >
            Reset
          </Button>
        </div>
      </div>
      
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
      
      {/* Exhibitions Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : exhibitions.length > 0 ? (
          <>
            <ExhibitionGrid
              exhibitions={exhibitions}
              columns={3}
              showCurator={true}
              showActions={true}
            />
            
            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <Pagination
                current={currentPage}
                total={totalExhibitions}
                pageSize={pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                hideOnSinglePage
              />
            </div>
          </>
        ) : (
          <Empty
            image={<EnvironmentOutlined style={{ fontSize: 60 }} />}
            description={
              <span>
                No exhibitions found matching your filters. Try adjusting your search criteria.
              </span>
            }
          >
            <Button type="primary" onClick={resetFilters}>
              Clear Filters
            </Button>
          </Empty>
        )}
      </div>
      
      {/* Call to Action for Curators */}
      <div className="mt-16">
        <Card className="bg-blue-50">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Are you a curator?</h2>
              <p className="mb-4">
                Create your own virtual exhibition and showcase your collection in a 3D environment.
              </p>
              <Button 
                type="primary" 
                size="large"
                onClick={() => router.push('/auth/register?role=curator')}
              >
                Join as Curator
              </Button>
            </div>
            <div className="w-32 h-32 flex items-center justify-center rounded-full bg-blue-100">
              <EnvironmentOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExhibitionsPage;