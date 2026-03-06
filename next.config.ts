// next.config.ts - Minimal webpack-compatible config
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Use webpack config (not turbopack)
  webpack: (config) => {
    // Optional: Add any webpack customizations here
    return config;
  },
};

export default nextConfig;