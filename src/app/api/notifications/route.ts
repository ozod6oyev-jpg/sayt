import { NextResponse } from "next/server";
import { articleTitle, listingTitle } from "@/lib/content";
import { formatDate, formatPrice } from "@/lib/format";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("locale") ?? "uz";
  const locale: Locale = isLocale(raw) ? raw : "uz";

  const [listings, articles] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
    }),
    prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  return NextResponse.json(
    {
      listings: listings.map((listing) => ({
        id: listing.id,
        title: listingTitle(listing, locale),
        price: formatPrice(listing.price, listing.currency, locale),
        district: listing.district,
        date: formatDate(listing.createdAt, locale),
        image: listing.photos[0]?.url ?? null,
        href: localePath(locale, `/elonlar/${listing.slug}`),
        createdAt: listing.createdAt.toISOString(),
      })),
      articles: articles.map((article) => ({
        id: article.id,
        title: articleTitle(article, locale),
        excerpt: locale === "ru" ? article.excerptRu : article.excerptUz,
        date: formatDate(article.publishedAt, locale),
        image: article.coverImage,
        href: localePath(locale, `/blog/${article.slug}`),
        createdAt: article.publishedAt.toISOString(),
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
