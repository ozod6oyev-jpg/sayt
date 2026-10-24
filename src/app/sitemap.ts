import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function languages(path: string) {
  return Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}${path}`]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, articles] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "active" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const staticPaths = ["", "/elonlar", "/blog", "/aloqa", "/maxfiylik"];
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "" || path === "/elonlar" ? "daily" : "monthly",
        priority: path === "" ? 1 : 0.8,
        alternates: { languages: languages(path) },
      });
    }
  }

  for (const listing of listings) {
    const path = `/elonlar/${listing.slug}`;
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: listing.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages: languages(path) },
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
      });
    }
  }

  return entries;
}
