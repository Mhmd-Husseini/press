import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'inventory-managment-husseini.s3.eu-north-1.amazonaws.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'inventory-managment-husseini.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
