import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['next-auth', '@prisma/client', 'bcryptjs', '@aws-sdk/client-s3'],
};

export default nextConfig;
