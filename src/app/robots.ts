import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Faqat ommaviy sahifalar indekslanadi. Boshqaruv paneli, kirish,
        // qurilma tasdiqlash va API qidiruvga umuman tushmasligi kerak.
        disallow: [
          "/admin",
          "/admin/",
          "/kirish",
          "/kirish/",
          "/verifydev",
          "/verifydev/",
          "/api",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
