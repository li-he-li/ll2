import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Vercel deployment
  output: 'standalone',

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mindverseglobal-cos-cdn.mindverse.com',
        pathname: '/front-img/**',
      },
      // Vercel Blob storage
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
      // Public uploads directory (local development)
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: false,
  },

  // Compression
  compress: true,

  // React strict mode
  reactStrictMode: true,

  // Server external packages for Prisma adapter
  serverExternalPackages: ['@prisma/adapter-pg'],
};

export default nextConfig;
