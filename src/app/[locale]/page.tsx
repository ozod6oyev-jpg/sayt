import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { SearchForm } from "@/components/search-form";
import { getDict, isLocale, localePath, siteName, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { alternatesFor, robotsMeta, siteUrl, socialMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);

  return {
    title: { absolute: `${siteName} — ${t.meta.homeTitle}` },
    description: t.meta.homeDescription,
    alternates: alternatesFor(locale, ""),
    robots: robotsMeta,
    ...socialMetadata({
      title: t.meta.homeTitle,
      description: t.meta.homeDescription,
      path: `/${locale}`,
      locale,
    }),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const t = getDict(locale);

  const [listings, articles, districtRows, totalActive] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
    }),
    prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.listing.findMany({
      where: { status: "active" },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    }),
    prisma.listing.count({ where: { status: "active" } }),
  ]);

  const districts = districtRows.map((row) => row.district);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteName,
          url: `${siteUrl}/${locale}`,
          inLanguage: locale,
        }}
      />

      <section className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 pb-10 text-white">
        <div className="container-page pt-14 pb-24 sm:pt-20">
          <p className="text-sm font-semibold tracking-wide text-brand-100 uppercase">
            {siteName} · O'zbekiston
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t.hero.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-brand-50">{t.hero.subtitle}</p>
          <p className="mt-4 text-sm text-brand-100">
            {t.search.results(totalActive)}
          </p>
        </div>
      </section>

      <div className="container-page -mt-14">
        <SearchForm locale={locale} districts={districts} />
      </div>

      <section className="container-page mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">{t.nav.listings}</h2>
          <Link
            href={localePath(locale, "/elonlar")}
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            {t.search.apply} →
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            {t.search.empty}
          </p>
        )}
      </section>

      <section className="mt-16 bg-slate-50 py-14">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-bold">{t.nav.blog}</h2>
            <Link
              href={localePath(locale, "/blog")}
              className="text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              {t.blog.all} →
            </Link>
          </div>

          {articles.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">{t.blog.empty}</p>
          )}
        </div>
      </section>

      <section className="container-page mt-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: locale === "ru" ? "Проверенные объявления" : "Tekshirilgan e'lonlar",
              text:
                locale === "ru"
                  ? "Каждый объект проверяется перед публикацией."
                  : "Har bir obyekt nashr etishdan oldin tekshiriladi.",
            },
            {
              title: locale === "ru" ? "Реальные фотографии" : "Haqiqiy rasmlar",
              text:
                locale === "ru"
                  ? "Фотографии объекта, а не стоковые изображения."
                  : "Obyektning o'z rasmlari, stok suratlar emas.",
            },
            {
              title: locale === "ru" ? "Помощь на каждом этапе" : "Har bosqichda yordam",
              text:
                locale === "ru"
                  ? "От выбора до оформления документов."
                  : "Tanlashdan hujjatlashtirishgacha.",
            },
          ].map((item) => (
            <div key={item.title} className="card p-5">
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
