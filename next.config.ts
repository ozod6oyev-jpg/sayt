import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [400, 640, 800, 1080, 1200, 1920],
  },
  experimental: {
    serverActions: {
      // Rasmlar 15 MB gacha yuklanishi mumkin
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
