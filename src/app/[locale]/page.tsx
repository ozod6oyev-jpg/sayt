import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { CameraIcon, HeadphonesIcon, ShieldCheckIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { ListingsSlider, type SliderSlide } from "@/components/listings-slider";
import { LoadMoreArticles } from "@/components/load-more-articles";
import { LoadMoreListings } from "@/components/load-more-listings";
import { SearchForm } from "@/components/search-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toArticleCardData } from "@/lib/article-view";
import { listingTitle, saleOptionLabel } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { ARTICLES_PER_PAGE, LISTINGS_PER_PAGE } from "@/lib/listing-query";
import { toListingCardData } from "@/lib/listing-view";
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

  const [listings, articles, districtRows, totalActive, totalArticles] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: LISTINGS_PER_PAGE,
      include: { photos: { orderBy: { sort: "asc" }, take: 1 }, saleOption: true },
    }),
    prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: ARTICLES_PER_PAGE,
    }),
    prisma.listing.findMany({
      where: { status: "active" },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    }),
    prisma.listing.count({ where: { status: "active" } }),
    prisma.article.count({ where: { published: true } }),
  ]);

  const districts = districtRows.map((row) => row.district);

  const listingCards = listings.map((listing) => toListingCardData(listing, locale));
  const articleCards = articles.map((article) => toArticleCardData(article, locale));

  const slides: SliderSlide[] = listings
    .filter((listing) => listing.photos[0])
    .slice(0, 5)
    .map((listing) => {
      const photo = listing.photos[0];

      return {
        id: listing.id,
        href: localePath(locale, `/elonlar/${listing.slug}`),
        title: listingTitle(listing, locale),
        price: formatPrice(listing.price, listing.currency, locale),
        location: `${listing.district}, ${listing.region}`,
        saleLabel: saleOptionLabel(listing.saleOption, locale) ?? t.listing.forSale,
        propertyTypeLabel:
          t.propertyType[listing.propertyType as keyof typeof t.propertyType] ??
          listing.propertyType,
        image: photo
          ? {
              url: photo.url,
              width: photo.width,
              height: photo.height,
              alt: photo.alt,
            }
          : null,
      };
    });

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

      <ListingsSlider items={slides} locale={locale} />

      <section className="container-page pt-8 sm:pt-10">
        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Badge variant="secondary" className="gap-1.5 border-brand-100 bg-brand-50 text-brand-700">
            <MapPin className="size-3" />
            {locale === "ru" ? "Ташкент · Узбекистан" : "Toshkent · O'zbekiston"}
          </Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {t.hero.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
            {t.hero.subtitle}
          </p>
        </div>

        <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
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

        {listingCards.length > 0 ? (
          <div className="mt-6">
            <LoadMoreListings
              initial={listingCards}
              hasMore={listingCards.length < totalActive}
              locale={locale}
            />
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
            <h2 className="section-heading">{t.nav.blog}</h2>
            <Link href={localePath(locale, "/blog")} className="link-more">
              {t.blog.all} →
            </Link>
          </div>

          {articleCards.length > 0 ? (
            <div className="mt-6">
              <LoadMoreArticles
                initial={articleCards}
                hasMore={articleCards.length < totalArticles}
                locale={locale}
              />
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
              <Card
                key={item.title}
                className="gap-0 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float"
              >
                <CardContent className="p-0">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
