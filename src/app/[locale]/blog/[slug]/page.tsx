import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/json-ld";
import { SimilarListings } from "@/components/similar-listings";
import { toArticleCardData } from "@/lib/article-view";
import { toListingCardData } from "@/lib/listing-view";
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

  const sameCategory = await prisma.article.findMany({
    where: {
      published: true,
      category: article.category,
      id: { not: article.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  // Shu bo'limda boshqa maqola bo'lmasa, boshqa maqolalarni taklif qilamiz
  const related =
    sameCategory.length > 0
      ? sameCategory
      : await prisma.article.findMany({
          where: { published: true, id: { not: article.id } },
          orderBy: { publishedAt: "desc" },
          take: 3,
        });

  const similarListings = await prisma.listing.findMany({
    where: { status: "active", photos: { some: {} } },
    orderBy: [{ views: "desc" }, { updatedAt: "desc" }],
    take: 6,
    include: {
      photos: { orderBy: { sort: "asc" }, take: 1 },
      saleOption: true,
    },
  });

  const similarCards = similarListings.map((listing) => toListingCardData(listing, locale));

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
    <article className="container-page py-8">
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

      <header className="mx-auto mt-4 max-w-3xl">
        <Badge variant="secondary">{t.category[article.category] ?? article.category}</Badge>

        <h1 className="mt-3 text-2xl leading-snug font-extrabold tracking-tight text-slate-900 sm:text-[2rem]">
          {title}
        </h1>

        <p className="mt-3 text-[0.95rem] leading-6 text-slate-600">{description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-200 py-3 text-[13px] text-slate-600">
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

      <figure className="mx-auto mt-6 max-w-4xl overflow-hidden rounded-2xl bg-muted shadow-float">
        <Image
          src={article.coverImage}
          alt={title}
          width={article.coverWidth}
          height={article.coverHeight}
          priority
          sizes="(max-width: 1024px) 100vw, 896px"
          className="h-[200px] w-full object-cover sm:h-[320px]"
        />
      </figure>

      <div className="mx-auto mt-8 max-w-3xl">
        <ArticleBody body={body} />
      </div>

      <div className="mx-auto mt-10 max-w-3xl border-t border-border pt-6">
        <Button asChild variant="outline" size="sm">
          <Link href={localePath(locale, "/blog")}>← {t.blog.all}</Link>
        </Button>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-12 max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t.blog.related}</h2>
              <p className="mt-1 text-xs text-slate-500">{t.blog.relatedHint}</p>
            </div>
            <Link
              href={localePath(locale, "/blog")}
              className="text-xs font-semibold whitespace-nowrap text-brand-700 hover:underline"
            >
              {t.blog.all} →
            </Link>
          </div>

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

      {similarCards.length > 0 && (
        <section className="mx-auto mt-12 max-w-5xl">
          <SimilarListings
            items={similarCards}
            locale={locale}
            title={t.blog.similarListings}
            subtitle={t.blog.similarListingsHint}
            allHref={localePath(locale, "/elonlar")}
            allLabel={t.blog.allListings}
            prevLabel={t.slider.prev}
            nextLabel={t.slider.next}
          />
        </section>
      )}

      <section className="mx-auto mt-10 max-w-5xl">
        <div className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t.blog.ctaTitle}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{t.blog.ctaText}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={localePath(locale, "/elonlar")}>{t.blog.ctaListings}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={localePath(locale, "/aloqa")}>{t.blog.ctaContact}</Link>
            </Button>
          </div>
        </div>
      </section>
    </article>
  );
}
