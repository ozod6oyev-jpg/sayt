import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { CameraIcon, HeadphonesIcon, ShieldCheckIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { SearchForm } from "@/components/search-form";
import { contact } from "@/lib/contact";
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

      <section className="bg-brand-900">
        <div className="container-page py-4 sm:py-6">
          <Image
            src="/banner.webp"
            alt={`${siteName} — ${contact.address[locale]}, ${contact.phoneDisplay}`}
            width={1500}
            height={600}
            priority
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="h-[220px] w-full rounded-2xl object-cover object-center shadow-float sm:h-[300px] lg:h-[360px]"
          />
        </div>
      </section>

      <section className="container-page pt-8 sm:pt-10">
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">
            {siteName}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t.hero.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{t.hero.subtitle}</p>
        </div>

        <div className="mt-6">
          <SearchForm locale={locale} districts={districts} />
        </div>
      </section>

      <section className="container-page mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-heading">{t.nav.listings}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.search.results(totalActive)}</p>
          </div>
          <Link href={localePath(locale, "/elonlar")} className="link-more">
            {locale === "ru" ? "Все объявления" : "Barcha e'lonlar"} →
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            {t.search.empty}
          </p>
        )}
      </section>

      <section className="mt-16 bg-slate-50 py-14">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-heading">{t.nav.blog}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.meta.blogDescription}</p>
            </div>
            <Link href={localePath(locale, "/blog")} className="link-more">
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

      <section className="container-page mt-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheckIcon,
              title: locale === "ru" ? "Проверенные объявления" : "Tekshirilgan e'lonlar",
              text:
                locale === "ru"
                  ? "Каждый объект проверяется перед публикацией."
                  : "Har bir obyekt nashr etishdan oldin tekshiriladi.",
            },
            {
              icon: CameraIcon,
              title: locale === "ru" ? "Реальные фотографии" : "Haqiqiy rasmlar",
              text:
                locale === "ru"
                  ? "Фотографии объекта, а не стоковые изображения."
                  : "Obyektning o'z rasmlari, stok suratlar emas.",
            },
            {
              icon: HeadphonesIcon,
              title: locale === "ru" ? "Помощь на каждом этапе" : "Har bosqichda yordam",
              text:
                locale === "ru"
                  ? "От выбора до оформления документов."
                  : "Tanlashdan hujjatlashtirishgacha.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
