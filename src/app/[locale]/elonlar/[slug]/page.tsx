import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { submitLead } from "@/app/actions/leads";
import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { listingDescription, listingTitle } from "@/lib/content";
import { formatArea, formatFloor, formatNumber, formatPrice } from "@/lib/format";
import { getDict, isLocale, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import {
  absoluteUrl,
  alternatesFor,
  robotsMeta,
  siteUrl,
  socialMetadata,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function getListing(slug: string) {
  return prisma.listing.findFirst({
    where: { slug, status: { in: ["active", "sold"] } },
    include: { photos: { orderBy: { sort: "asc" } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const listing = await getListing(slug);
  if (!listing) return {};

  const title = listingTitle(listing, locale);
  const description = listingDescription(listing, locale).slice(0, 160);
  const cover = listing.photos[0];

  return {
    title,
    description,
    alternates: alternatesFor(locale, `/elonlar/${slug}`),
    robots: robotsMeta,
    ...socialMetadata({
      title,
      description,
      path: `/${locale}/elonlar/${slug}`,
      image: cover?.url,
      locale,
    }),
  };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const t = getDict(locale);
  const query = await searchParams;
  const leadStatus = Array.isArray(query.lead) ? query.lead[0] : query.lead;

  const listing = await getListing(slug);
  if (!listing) notFound();

  // Ko'rishlar sonini oshiramiz
  await prisma.listing
    .update({ where: { id: listing.id }, data: { views: { increment: 1 } } })
    .catch(() => undefined);

  const title = listingTitle(listing, locale);
  const description = listingDescription(listing, locale);
  const cover = listing.photos[0];
  const canonical = `${siteUrl}/${locale}/elonlar/${listing.slug}`;
  const phoneHref = `tel:${listing.phone.replace(/[^\d+]/g, "")}`;

  const similar = await prisma.listing.findMany({
    where: {
      status: "active",
      id: { not: listing.id },
      OR: [{ district: listing.district }, { propertyType: listing.propertyType }],
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
  });

  const specs = [
    { label: t.listing.rooms, value: listing.rooms ? formatNumber(listing.rooms, locale) : "—" },
    { label: t.listing.area, value: formatArea(listing.area, locale) },
    { label: t.listing.floor, value: formatFloor(listing.floor, listing.totalFloors, locale) },
    {
      label: t.listing.year,
      value: listing.yearBuilt ? formatNumber(listing.yearBuilt, locale) : "—",
    },
    {
      label: t.listing.condition,
      value: listing.condition ? (t.condition[listing.condition] ?? listing.condition) : "—",
    },
    {
      label: t.search.propertyType,
      value:
        t.propertyType[listing.propertyType as keyof typeof t.propertyType] ?? listing.propertyType,
    },
  ];

  return (
    <div className="container-page py-8">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: title,
            description,
            url: canonical,
            image: listing.photos.map((photo) => absoluteUrl(photo.url)),
            datePosted: listing.createdAt.toISOString(),
            numberOfRooms: listing.rooms ?? undefined,
            floorSize: listing.area
              ? { "@type": "QuantitativeValue", value: listing.area, unitCode: "MTK" }
              : undefined,
            address: {
              "@type": "PostalAddress",
              streetAddress: listing.address,
              addressLocality: listing.district,
              addressRegion: listing.region,
              addressCountry: "UZ",
            },
            ...(listing.lat != null && listing.lng != null
              ? { geo: { "@type": "GeoCoordinates", latitude: listing.lat, longitude: listing.lng } }
              : {}),
            offers: {
              "@type": "Offer",
              price: listing.price.toString(),
              priceCurrency: listing.currency,
              availability:
                listing.status === "sold"
                  ? "https://schema.org/SoldOut"
                  : "https://schema.org/InStock",
              url: canonical,
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
                item: `${siteUrl}/${locale}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: t.nav.listings,
                item: `${siteUrl}/${locale}/elonlar`,
              },
              { "@type": "ListItem", position: 3, name: title, item: canonical },
            ],
          },
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
        <Link href={`/${locale}`} className="hover:text-brand-700">
          {t.nav.home}
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/${locale}/elonlar`} className="hover:text-brand-700">
          {t.nav.listings}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-700">{title}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {cover ? (
            <div className="overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={cover.url}
                alt={cover.alt || title}
                width={cover.width}
                height={cover.height}
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="h-auto w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
              {t.admin.noPhotos}
            </div>
          )}

          {listing.photos.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {listing.photos.slice(1).map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={photo.url}
                    alt={photo.alt || title}
                    width={photo.width}
                    height={photo.height}
                    sizes="(max-width: 640px) 33vw, 20vw"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
                <p className="mt-2 text-sm text-slate-600">
                  📍 {listing.address}, {listing.district}, {listing.region}
                </p>
              </div>
              {listing.status === "sold" && (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  {t.listing.sold}
                </span>
              )}
            </div>

            <p className="mt-4 text-3xl font-bold text-brand-700">
              {formatPrice(listing.price, listing.currency, locale)}
            </p>
            {listing.area ? (
              <p className="mt-1 text-sm text-slate-500">
                {formatPrice(
                  BigInt(Math.round(Number(listing.price) / listing.area)),
                  listing.currency,
                  locale,
                )}{" "}
                / m²
              </p>
            ) : null}

            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
              {specs.map((spec) => (
                <div key={spec.label} className="bg-white p-4">
                  <dt className="text-xs text-slate-500">{spec.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{spec.value}</dd>
                </div>
              ))}
            </dl>

            <section className="mt-8">
              <h2 className="text-lg font-semibold">{t.listing.description}</h2>
              <div className="mt-3 space-y-4 text-sm leading-7 text-slate-700">
                {description
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            </section>

            {listing.lat != null && listing.lng != null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                📍 {t.listing.map}
              </a>
            )}

            <p className="mt-6 text-xs text-slate-400">
              {formatNumber(listing.views, locale)} {t.listing.views}
            </p>
          </div>
        </div>

        <aside id="aloqa" className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="text-2xl font-bold text-slate-900">
              {formatPrice(listing.price, listing.currency, locale)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {listing.district}, {listing.region}
            </p>

            <a href={phoneHref} className="btn-primary mt-4 w-full">
              📞 {listing.phone}
            </a>

            <hr className="my-5 border-slate-200" />

            {leadStatus === "sent" && (
              <p className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
                {t.lead.sent}
              </p>
            )}
            {leadStatus === "error" && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{t.lead.error}</p>
            )}

            <h2 className="text-base font-semibold">{t.lead.title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{t.lead.subtitle}</p>

            <form action={submitLead} className="mt-4 space-y-3">
              <input type="hidden" name="listingId" value={listing.id} />
              <input
                type="hidden"
                name="returnTo"
                value={`/${locale}/elonlar/${listing.slug}`}
              />
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <div>
                <label className="label" htmlFor="name">
                  {t.lead.name}
                </label>
                <input id="name" name="name" required minLength={2} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  {t.lead.phone}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+998 90 123 45 67"
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="message">
                  {t.lead.message}
                </label>
                <textarea id="message" name="message" rows={3} className="field" />
              </div>
              <button type="submit" className="btn-primary w-full">
                {t.lead.send}
              </button>
            </form>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold">{t.listing.similar}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => (
              <ListingCard key={item.id} listing={item} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
