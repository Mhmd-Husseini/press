import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'phoenix-press-media-staging.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'inventory-managment-husseini.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static-cse.canva.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/**', 
      }
    ],
  },
  typescript: {
    // Ignore TypeScript errors in development, strict in production
    ignoreBuildErrors: process.env.NODE_ENV !== 'production',
  },
  eslint: {
    // Ignore ESLint errors in development, strict in production
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },
  // Enable strict mode for production
  reactStrictMode: process.env.NODE_ENV === 'production',
};

export default nextConfig;
