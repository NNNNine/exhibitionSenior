'use client';

import React, { useState, useEffect } from 'react';
import { Button, Carousel, Card, Typography, Row, Col, Spin, List, Avatar } from 'antd';
import { useRouter } from 'next/navigation';
import { 
  EnvironmentOutlined, 
  PictureOutlined, 
  UserOutlined, 
  RightCircleOutlined 
} from '@ant-design/icons';
import { getExhibitions, getArtworks } from '@/lib/api/index';
import { formatDate } from '@/utils/format';
import { Exhibition } from '@/types/exhibition.types';
import { Artwork } from '@/types/artwork.types';
import Image from 'next/image';

const { Title, Paragraph } = Typography;

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [featuredExhibitions, setFeaturedExhibitions] = useState<Exhibition[]>([]);
  const [recentArtworks, setRecentArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch active exhibitions
        const { exhibitions } = await getExhibitions({ 
          isActive: true,
          limit: 4 
        });
        
        // Fetch recent artworks
        const { artworks } = await getArtworks({ 
          limit: 6 
        });
        
        setFeaturedExhibitions(exhibitions);
        setRecentArtworks(artworks);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="absolute inset-0 z-0 opacity-30">
          <Image
            src="/images/hero-background.jpg" // Replace with your actual image path
            alt="Exhibition Art"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <div className="container mx-auto px-6 z-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Experience Art in a New Dimension
            </h1>
            <p className="text-xl mb-8">
              Explore virtual exhibitions and discover amazing artworks in an immersive 3D environment.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                type="primary" 
                size="large"
                onClick={() => router.push('/exhibitions')}
                className="h-12 px-8 text-lg"
              >
                Browse Exhibitions
              </Button>
              <Button 
                size="large"
                onClick={() => router.push('/auth/register')}
                className="h-12 px-8 text-lg"
              >
                Join as Artist
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Exhibitions Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-10">
            <Title level={2}>Featured Exhibitions</Title>
            <Button 
              type="link" 
              onClick={() => router.push('/exhibitions')}
              icon={<RightCircleOutlined />}
            >
              See All Exhibitions
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {featuredExhibitions.map((exhibition) => (
                <Col xs={24} sm={12} md={8} lg={6} key={exhibition.id}>
                  <Card
                    hoverable
                    cover={
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <EnvironmentOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                      </div>
                    }
                    onClick={() => router.push(`/exhibitions/${exhibition.id}`)}
                  >
                    <Card.Meta
                      title={exhibition.title}
                      description={
                        <>
                          <p className="text-gray-500 line-clamp-2 mb-2">
                            {exhibition.description}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
                          </p>
                        </>
                      }
                    />
                  </Card>
                </Col>
              ))}
              
              {featuredExhibitions.length === 0 && (
                <Col span={24}>
                  <div className="text-center py-12">
                    <p className="text-gray-500">No active exhibitions at the moment. Check back soon!</p>
                  </div>
                </Col>
              )}
            </Row>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <Title level={2} className="text-center mb-12">How It Works</Title>
          
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Card className="h-full text-center">
                <div className="text-4xl text-blue-500 mb-4">
                  <UserOutlined />
                </div>
                <Title level={3}>Join as an Artist</Title>
                <Paragraph>
                  Create your profile, upload your artworks, and get discovered by curators and art enthusiasts.
                </Paragraph>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card className="h-full text-center">
                <div className="text-4xl text-blue-500 mb-4">
                  <PictureOutlined />
                </div>
                <Title level={3}>Share Your Art</Title>
                <Paragraph>
                  Upload high-quality images of your artwork along with descriptions, categories, and tags.
                </Paragraph>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card className="h-full text-center">
                <div className="text-4xl text-blue-500 mb-4">
                  <EnvironmentOutlined />
                </div>
                <Title level={3}>Experience in 3D</Title>
                <Paragraph>
                  Explore curated exhibitions in our immersive 3D virtual gallery environment.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Recent Artworks Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-10">
            <Title level={2}>Recently Added Artworks</Title>
            <Button 
              type="link" 
              onClick={() => router.push('/artworks')}
              icon={<RightCircleOutlined />}
            >
              Browse All Artworks
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {recentArtworks.map((artwork) => (
                <Col xs={24} sm={12} md={8} key={artwork.id}>
                  <Card
                    hoverable
                    cover={
                      <img
                        alt={artwork.title}
                        src={artwork.thumbnailUrl || artwork.fileUrl}
                        className="h-48 w-full object-cover"
                      />
                    }
                    onClick={() => router.push(`/artworks/${artwork.id}`)}
                  >
                    <Card.Meta
                      title={artwork.title}
                      description={
                        <>
                          <p className="text-gray-500 mb-2">
                            By {artwork.artist?.username || `Artist #${artwork.artistId}`}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(artwork.creationDate)}
                          </p>
                        </>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <Title level={2} style={{ color: 'white' }}>Ready to Join Our Art Community?</Title>
          <Paragraph className="text-lg mb-8 max-w-2xl mx-auto">
            Whether you're an artist looking to showcase your work, a curator creating immersive exhibitions,
            or an art enthusiast exploring new creations, we have a place for you.
          </Paragraph>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              type="primary" 
              size="large"
              onClick={() => router.push('/auth/register')}
              className="h-12 px-8 text-lg"
            >
              Sign Up Now
            </Button>
            <Button 
              ghost
              size="large"
              onClick={() => router.push('/exhibitions')}
              className="h-12 px-8 text-lg"
            >
              Browse Exhibitions
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}