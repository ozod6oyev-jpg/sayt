import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoadMoreListings } from "@/components/load-more-listings";
import { SearchForm, type SearchParams } from "@/components/search-form";
import { getDict, isLocale, type Locale } from "@/lib/i18n";
import { LISTINGS_PER_PAGE, listingWhere } from "@/lib/listing-query";
import { toListingCardData } from "@/lib/listing-view";
import { prisma } from "@/lib/prisma";
import { alternatesFor, robotsMeta, socialMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);

  return {
    title: t.meta.listingsTitle,
    description: t.meta.listingsDescription,
    alternates: alternatesFor(locale, "/elonlar"),
    robots: robotsMeta,
    ...socialMetadata({
      title: t.meta.listingsTitle,
      description: t.meta.listingsDescription,
      path: `/${locale}/elonlar`,
      locale,
    }),
  };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ListingsPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const t = getDict(locale);
  const query = await searchParams;

  const values: SearchParams = {
    propertyType: first(query.propertyType),
    district: first(query.district),
    rooms: first(query.rooms),
    minPrice: first(query.minPrice),
    maxPrice: first(query.maxPrice),
  };

  const where = listingWhere(values);

  const [total, listings, districtRows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: LISTINGS_PER_PAGE,
      include: {
        photos: { orderBy: { sort: "asc" }, take: 1 },
        saleOption: true,
      },
    }),
    prisma.listing.findMany({
      where: { status: "active" },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    }),
  ]);

  const districts = districtRows.map((row) => row.district);
  const cards = listings.map((listing) => toListingCardData(listing, locale));

  return (
    <div className="container-page py-8">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
        <Link href={`/${locale}`} className="hover:text-brand-700">
          {t.nav.home}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-700">{t.nav.listings}</span>
      </nav>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.nav.listings}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {t.meta.listingsDescription}
      </p>

      <div className="mt-6">
        <SearchForm locale={locale} districts={districts} values={values} />
      </div>

      <p className="mt-6 text-sm font-medium text-slate-600">{t.search.results(total)}</p>

      {cards.length > 0 ? (
        <div className="mt-4">
          <LoadMoreListings
            key={JSON.stringify(values)}
            initial={cards}
            hasMore={cards.length < total}
            locale={locale}
            filters={values}
          />
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          {t.search.empty}
        </p>
      )}
    </div>
  );
}
