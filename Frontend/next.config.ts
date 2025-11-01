import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 optimizations - Turbopack is default, no config needed
  
  // Image optimization updates for Next.js 16
  images: {
    minimumCacheTTL: 14400, // 4 hours (new default)
    imageSizes: [32, 48, 64, 96, 128, 256, 384], // Removed 16px (new default)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    qualities: [75], // New default (was [1..100])
    dangerouslyAllowLocalIP: false, // New security restriction
    maximumRedirects: 3, // New default (was unlimited)
  },
  
  // Enhanced logging (Next.js 16 feature)
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
