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
  Collapse,
  Checkbox,
  Radio,
  Slider,
  Alert
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  SortAscendingOutlined, 
  PictureOutlined 
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { getArtworks } from '@/lib/api';
import { Artwork } from '@/types/artwork.types';
import ArtworkGrid from '@/components/artwork/ArtworkGrid';

const { Search } = Input;
const { Option } = Select;


const ArtworksPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse query parameters
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  
  // State for artworks and pagination
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalArtworks, setTotalArtworks] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(12);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // Available filter options (would come from API in a real app)
  const categories = ['Painting', 'Photography', 'Digital Art', 'Sculpture', 'Mixed Media', 'Other'];
  const tags = ['Abstract', 'Portrait', 'Landscape', 'Still Life', 'Modern', 'Contemporary', 'Traditional', 'Experimental'];
  
  // Function to update URL with current filters
  const updateQueryParams = (params: Record<string, string | number | null>) => {
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
  
  // Fetch artworks with current filters
  const fetchArtworks = async (page: number = currentPage) => {
    setLoading(true);
    setError(null);
    
    try {
      // Construct query parameters
      const params: any = {
        page,
        limit: pageSize,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');
      
      // Sort order
      switch (sortBy) {
        case 'oldest':
          params.sort = 'creationDate';
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
          params.sort = 'creationDate';
          params.order = 'desc';
          break;
      }
      
      const { artworks: fetchedArtworks, pagination } = await getArtworks(params);
      
      setArtworks(fetchedArtworks);
      setTotalArtworks(pagination.total);
      setCurrentPage(pagination.page);
      
      // Update URL with current filters
      updateQueryParams({
        search: searchQuery || null,
        category: selectedCategory || null,
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
  
  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1); // Reset to first page on new filter
  };
  
  // Handle tag selection
  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags);
    setCurrentPage(1); // Reset to first page on new filter
  };
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
    fetchArtworks(currentPage);
  };
  
  // Handle pagination change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchArtworks(page);
    
    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    fetchArtworks(1);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTags([]);
    setSortBy('newest');
    setCurrentPage(1);
    
    // Clear URL parameters
    updateQueryParams({
      search: null,
      category: null,
      page: null,
    });
    
    fetchArtworks(1);
  };
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchArtworks(initialPage);
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Artworks</h1>
        <p className="text-gray-500">
          Explore unique artworks from artists around the world
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-1/4">
          <Card className="sticky top-24">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Search</h2>
              <Search
                placeholder="Search by title or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                enterButton
              />
            </div>
            
            <Divider />
            
            <Collapse 
              defaultActiveKey={['category', 'sort']}
              items={[
                {
                  key: 'category',
                  label: 'Category',
                  children: (
                    <div className="mb-4">
                      <Select
                        placeholder="Select Category"
                        value={selectedCategory || undefined}
                        onChange={handleCategoryChange}
                        style={{ width: '100%' }}
                        allowClear
                      >
                        {categories.map((category) => (
                          <Option key={category} value={category}>
                            {category}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  )
                },
                {
                  key: 'tags',
                  label: 'Tags',
                  children: (
                    <Checkbox.Group
                      options={tags.map(tag => ({ label: tag, value: tag }))}
                      value={selectedTags}
                      onChange={handleTagChange as any}
                      className="flex flex-col space-y-2"
                    />
                  )
                },
                {
                  key: 'sort',
                  label: 'Sort By',
                  children: (
                    <Radio.Group 
                      value={sortBy} 
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="flex flex-col space-y-2"
                    >
                      <Radio value="newest">Newest First</Radio>
                      <Radio value="oldest">Oldest First</Radio>
                      <Radio value="title_asc">Title A-Z</Radio>
                      <Radio value="title_desc">Title Z-A</Radio>
                    </Radio.Group>
                  )
                }
              ]}
            />
            
            <div className="mt-6 flex flex-col space-y-3">
              <Button
                type="primary"
                onClick={applyFilters}
                icon={<FilterOutlined />}
                block
              >
                Apply Filters
              </Button>
              <Button onClick={resetFilters} block>
                Reset Filters
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          {/* Result Stats and Actions */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              {!loading && (
                <p className="text-gray-500">
                  Showing {artworks.length} of {totalArtworks} artworks
                </p>
              )}
            </div>
            
            <div className="mt-3 sm:mt-0 w-full sm:w-auto">
              <Select
                value={sortBy}
                onChange={handleSortChange}
                style={{ width: '100%', minWidth: '200px' }}
                placeholder="Sort by"
              >
                <Option value="newest">Newest First</Option>
                <Option value="oldest">Oldest First</Option>
                <Option value="title_asc">Title A-Z</Option>
                <Option value="title_desc">Title Z-A</Option>
              </Select>
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
          
          {/* Artwork Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spin size="large" />
            </div>
          ) : artworks.length > 0 ? (
            <>
              <ArtworkGrid 
                artworks={artworks} 
                columns={3}
              />
              
              {/* Pagination */}
              <div className="mt-8 flex justify-center">
                <Pagination
                  current={currentPage}
                  total={totalArtworks}
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
              image={<PictureOutlined style={{ fontSize: 60 }} />}
              description={
                <span>
                  No artworks found matching your filters. Try adjusting your search criteria.
                </span>
              }
            >
              <Button type="primary" onClick={resetFilters}>
                Clear Filters
              </Button>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtworksPage;