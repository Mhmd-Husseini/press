import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
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
    // Ignore TypeScript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors
    ignoreDuringBuilds: true,
  },
  // Suppress client-side warnings
  reactStrictMode: false,
};

export default nextConfig;
