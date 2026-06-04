import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-neon',
    '@neondatabase/serverless',
    'ws',
    'bcryptjs',
    '@aws-sdk/client-s3',
  ],
};

export default nextConfig;
