import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Image optimization
  images: {
    domains: [],
  },
};

export default nextConfig;
