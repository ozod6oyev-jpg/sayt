import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [400, 640, 800, 1080, 1200, 1920],
  },
  async headers() {
    // Boshqaruv paneli, kirish va API sahifalari qidiruvga tushmasin:
    // meta noindex'ga qo'shimcha ravishda sarlavha bilan ham yopamiz
    const privatePaths = [
      "/admin",
      "/admin/:path*",
      "/kirish",
      "/kirish/:path*",
      "/verifydev",
      "/verifydev/:path*",
      "/api",
      "/api/:path*",
    ];

    return [
      {
        // Service worker yangilanishi darhol kuchga kirishi uchun keshlanmaydi
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      ...privatePaths.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" }],
      })),
    ];
  },
  experimental: {
    serverActions: {
      // Rasmlar 15 MB, Reels videolari 200 MB gacha yuklanishi mumkin
      bodySizeLimit: "210mb",
    },
  },
};

export default nextConfig;
