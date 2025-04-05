import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['placehold.co', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.exhibition-art.com',
        pathname: '/uploads/**',
      },
    ],
  },
  typescript: {
    // Type checking is done by the IDE in development, so we can disable it for faster builds
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
