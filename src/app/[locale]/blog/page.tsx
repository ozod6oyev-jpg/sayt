import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoadMoreArticles } from "@/components/load-more-articles";
import { toArticleCardData } from "@/lib/article-view";
import { getDict, isLocale } from "@/lib/i18n";
import { ARTICLES_PER_PAGE } from "@/lib/listing-query";
import { prisma } from "@/lib/prisma";
import { alternatesFor, robotsMeta, socialMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = getDict(locale);

  return {
    title: t.meta.blogTitle,
    description: t.meta.blogDescription,
    alternates: alternatesFor(locale, "/blog"),
    robots: robotsMeta,
    ...socialMetadata({
      title: t.meta.blogTitle,
      description: t.meta.blogDescription,
      path: `/${locale}/blog`,
      locale,
    }),
  };
}

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = getDict(locale);

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: ARTICLES_PER_PAGE,
    }),
    prisma.article.count({ where: { published: true } }),
  ]);

  const cards = articles.map((article) => toArticleCardData(article, locale));

  return (
    <div className="container-page py-10">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {t.nav.blog}
        </h1>
        <p className="mt-3 text-slate-600">{t.meta.blogDescription}</p>
      </header>

      {cards.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          {t.blog.empty}
        </p>
      ) : (
        <div className="mt-8">
          <LoadMoreArticles
            initial={cards}
            hasMore={cards.length < total}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}
