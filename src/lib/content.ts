import type { Article, Listing } from "@prisma/client";
import type { Locale } from "./i18n";

export function listingTitle(listing: Pick<Listing, "titleUz" | "titleRu">, locale: Locale) {
  return locale === "ru" ? listing.titleRu : listing.titleUz;
}

export function listingDescription(
  listing: Pick<Listing, "descriptionUz" | "descriptionRu">,
  locale: Locale,
) {
  return locale === "ru" ? listing.descriptionRu : listing.descriptionUz;
}

export function articleTitle(article: Pick<Article, "titleUz" | "titleRu">, locale: Locale) {
  return locale === "ru" ? article.titleRu : article.titleUz;
}

export function articleExcerpt(article: Pick<Article, "excerptUz" | "excerptRu">, locale: Locale) {
  return locale === "ru" ? article.excerptRu : article.excerptUz;
}

export function articleBody(article: Pick<Article, "bodyUz" | "bodyRu">, locale: Locale) {
  return locale === "ru" ? article.bodyRu : article.bodyUz;
}

export function propertyTypeLabel(value: string, propertyTypes: Record<string, string>): string {
  return propertyTypes[value] ?? value;
}
