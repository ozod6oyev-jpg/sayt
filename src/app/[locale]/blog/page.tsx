import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { getDict, isLocale } from "@/lib/i18n";
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

  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="container-page py-10">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {t.nav.blog}
        </h1>
        <p className="mt-3 text-slate-600">{t.meta.blogDescription}</p>
      </header>

      {articles.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          {t.blog.empty}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
