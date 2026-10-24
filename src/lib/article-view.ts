import type { Article } from "@prisma/client";
import { articleExcerpt, articleTitle } from "./content";
import { formatDate } from "./format";
import { getDict, type Locale } from "./i18n";

export type ArticleCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  dateLabel: string;
  cover: { url: string; width: number; height: number };
};

export function toArticleCardData(article: Article, locale: Locale): ArticleCardData {
  const t = getDict(locale);

  return {
    id: article.id,
    slug: article.slug,
    title: articleTitle(article, locale),
    excerpt: articleExcerpt(article, locale),
    categoryLabel: t.category[article.category] ?? article.category,
    dateLabel: formatDate(article.publishedAt, locale),
    cover: {
      url: article.coverImage,
      width: article.coverWidth,
      height: article.coverHeight,
    },
  };
}
