import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfjs-dist', 'z-ai-web-dev-sdk'],
  turbopack: {},
};

export default nextConfig;
