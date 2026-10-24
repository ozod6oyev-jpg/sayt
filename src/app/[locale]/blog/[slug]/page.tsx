import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/json-ld";
import { toArticleCardData } from "@/lib/article-view";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { articleBody, articleExcerpt, articleTitle } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { getDict, isLocale, localePath, siteName } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import {
  absoluteUrl,
  alternatesFor,
  robotsMeta,
  siteUrl,
  socialMetadata,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

async function getArticle(slug: string) {
  return prisma.article.findFirst({
    where: { slug, published: true },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const article = await getArticle(slug);
  if (!article) return {};

  const title = articleTitle(article, locale);
  const description = articleExcerpt(article, locale);

  return {
    title,
    description,
    alternates: alternatesFor(locale, `/blog/${article.slug}`),
    robots: robotsMeta,
    ...socialMetadata({
      title,
      description,
      path: `/${locale}/blog/${article.slug}`,
      image: article.coverImage,
      type: "article",
      locale,
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      author: article.authorName,
    }),
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const t = getDict(locale);
  const article = await getArticle(slug);
  if (!article) notFound();

  const title = articleTitle(article, locale);
  const description = articleExcerpt(article, locale);
  const body = articleBody(article, locale);

  const related = await prisma.article.findMany({
    where: {
      published: true,
      category: article.category,
      id: { not: article.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const articleUrl = absoluteUrl(`/${locale}/blog/${article.slug}`);

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      image: [absoluteUrl(article.coverImage)],
      datePublished: article.publishedAt.toISOString(),
      dateModified: article.updatedAt.toISOString(),
      inLanguage: locale,
      author: {
        "@type": "Person",
        name: article.authorName,
      },
      publisher: {
        "@type": "Organization",
        name: siteName,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/favicon.svg`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": articleUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t.nav.home,
          item: absoluteUrl(`/${locale}`),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t.nav.blog,
          item: absoluteUrl(`/${locale}/blog`),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: articleUrl,
        },
      ],
    },
  ];

  return (
    <article className="container-page py-10">
      <JsonLd data={jsonLd} />

      <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
        <Link href={localePath(locale)} className="hover:text-brand-700">
          {t.nav.home}
        </Link>
        <span className="mx-2">/</span>
        <Link href={localePath(locale, "/blog")} className="hover:text-brand-700">
          {t.nav.blog}
        </Link>
      </nav>

      <header className="mx-auto mt-6 max-w-3xl">
        <Badge variant="secondary">{t.category[article.category] ?? article.category}</Badge>

        <h1 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-slate-200 py-4 text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback>{article.authorName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-slate-900">{article.authorName}</p>
              {article.authorRole && <p className="text-xs text-slate-500">{article.authorRole}</p>}
            </div>
          </div>

          <p>
            <span className="text-slate-400">{t.blog.published}: </span>
            <time dateTime={article.publishedAt.toISOString()}>
              {formatDate(article.publishedAt, locale)}
            </time>
          </p>

          {article.updatedAt.getTime() > article.publishedAt.getTime() && (
            <p>
              <span className="text-slate-400">{t.blog.updated}: </span>
              <time dateTime={article.updatedAt.toISOString()}>
                {formatDate(article.updatedAt, locale)}
              </time>
            </p>
          )}
        </div>
      </header>

      <figure className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl bg-muted shadow-float">
        <Image
          src={article.coverImage}
          alt={title}
          width={article.coverWidth}
          height={article.coverHeight}
          priority
          sizes="(max-width: 1024px) 100vw, 896px"
          className="w-full object-cover"
        />
      </figure>

      <div className="mx-auto mt-10 max-w-3xl">
        <ArticleBody body={body} />
      </div>

      <footer className="mx-auto mt-10 max-w-3xl border-t border-border pt-6">
        <Button asChild variant="outline" size="sm">
          <Link href={localePath(locale, "/blog")}>← {t.blog.all}</Link>
        </Button>
      </footer>

      {related.length > 0 && (
        <section className="mx-auto mt-14 max-w-5xl">
          <h2 className="text-xl font-bold text-slate-900">{t.blog.related}</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ArticleCard
                key={item.id}
                article={toArticleCardData(item, locale)}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
