"use server";

import type { SearchParams } from "@/components/search-form";
import { toArticleCardData, type ArticleCardData } from "@/lib/article-view";
import { ARTICLES_PER_PAGE, LISTINGS_PER_PAGE, listingWhere } from "@/lib/listing-query";
import { toListingCardData, type ListingCardData } from "@/lib/listing-view";
import type { Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

type Batch<T> = { items: T[]; hasMore: boolean };

function validLocale(locale: string): locale is Locale {
  return locale === "uz" || locale === "ru";
}

export async function loadListings({
  locale,
  page,
  filters,
}: {
  locale: Locale;
  page: number;
  filters?: SearchParams;
}): Promise<Batch<ListingCardData>> {
  if (!validLocale(locale)) return { items: [], hasMore: false };

  const safePage = Math.max(1, Math.trunc(page));
  const take = LISTINGS_PER_PAGE;
  const where = listingWhere(filters ?? {});

  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * take,
      take,
      include: {
        photos: { orderBy: { sort: "asc" }, take: 1 },
        saleOption: true,
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    items: rows.map((row) => toListingCardData(row, locale)),
    hasMore: safePage * take < total,
  };
}

export async function loadArticles({
  locale,
  page,
}: {
  locale: Locale;
  page: number;
}): Promise<Batch<ArticleCardData>> {
  if (!validLocale(locale)) return { items: [], hasMore: false };

  const safePage = Math.max(1, Math.trunc(page));
  const take = ARTICLES_PER_PAGE;
  const where = { published: true };

  const [rows, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (safePage - 1) * take,
      take,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items: rows.map((row) => toArticleCardData(row, locale)),
    hasMore: safePage * take < total,
  };
}
