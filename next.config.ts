import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['next-auth', '@prisma/client', 'bcryptjs'],
};

export default nextConfig;
