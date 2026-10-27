import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/seo";

// Har so'rovda bazadan qayta o'qiladi — yangi e'lon darhol sitemap'ga tushadi
export const dynamic = "force-dynamic";
export const revalidate = 0;

function languages(path: string) {
  return Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}${path}`]));
}

function imageUrl(path: string): string {
  return path.startsWith("http") ? path : `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, articles] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "active" },
      select: {
        slug: true,
        updatedAt: true,
        photos: { select: { url: true }, orderBy: { sort: "asc" }, take: 5 },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, coverImage: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const staticPaths = ["", "/elonlar", "/blog", "/aloqa", "/maxfiylik", "/qoidalar", "/mualliflik"];

  // Oxirgi kontent o'zgargan sana — har so'rovda «hozir» yozilsa Google lastmod'ga ishonmaydi
  const contentDate = new Date(
    Math.max(0, ...[...listings, ...articles].map((row) => row.updatedAt.getTime())),
  );
  const lastModified = contentDate.getTime() > 0 ? contentDate : undefined;

  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified,
        changeFrequency: path === "" || path === "/elonlar" ? "daily" : "monthly",
        priority: path === "" ? 1 : 0.8,
        alternates: { languages: languages(path) },
      });
    }
  }

  for (const listing of listings) {
    const path = `/elonlar/${listing.slug}`;
    const images = listing.photos.map((photo) => imageUrl(photo.url));

    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: listing.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages: languages(path) },
        ...(images.length > 0 ? { images } : {}),
      });
    }
  }

  for (const article of articles) {
    const path = `/blog/${article.slug}`;
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: article.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: languages(path) },
        images: [imageUrl(article.coverImage)],
      });
    }
  }

  return entries;
}
