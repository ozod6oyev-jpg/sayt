import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { ListingCard } from "@/components/listing-card";
import { SearchForm, type SearchParams } from "@/components/search-form";
import { getDict, isLocale, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { alternatesFor, robotsMeta, socialMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;
const PROPERTY_TYPES = ["apartment", "house", "land", "commercial"] as const;

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
    type: first(query.type),
    propertyType: first(query.propertyType),
    district: first(query.district),
    rooms: first(query.rooms),
    minPrice: first(query.minPrice),
    maxPrice: first(query.maxPrice),
  };

  const page = Math.max(1, Number(first(query.page) ?? "1") || 1);

  const where: Prisma.ListingWhereInput = { status: "active" };

  if (values.type === "sale" || values.type === "rent") {
    where.type = values.type;
  }

  if (values.propertyType && PROPERTY_TYPES.includes(values.propertyType as never)) {
    where.propertyType = values.propertyType;
  }

  if (values.district) {
    where.district = values.district;
  }

  if (values.rooms) {
    if (values.rooms === "5+") {
      where.rooms = { gte: 5 };
    } else if (Number.isFinite(Number(values.rooms))) {
      where.rooms = Number(values.rooms);
    }
  }

  const priceFilter: { gte?: bigint; lte?: bigint } = {};
  if (values.minPrice) {
    const min = Number(values.minPrice);
    if (Number.isFinite(min) && min >= 0) priceFilter.gte = BigInt(Math.trunc(min));
  }
  if (values.maxPrice) {
    const max = Number(values.maxPrice);
    if (Number.isFinite(max) && max >= 0) priceFilter.lte = BigInt(Math.trunc(max));
  }
  if (priceFilter.gte !== undefined || priceFilter.lte !== undefined) {
    where.price = priceFilter;
  }

  const [total, listings, districtRows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
    }),
    prisma.listing.findMany({
      where: { status: "active" },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    }),
  ]);

  const districts = districtRows.map((row) => row.district);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const buildPageHref = (targetPage: number) => {
    const sp = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value) sp.set(key, value);
    });
    if (targetPage > 1) sp.set("page", String(targetPage));
    const qs = sp.toString();
    return `/${locale}/elonlar${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="container-page py-8">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
        <Link href={`/${locale}`} className="hover:text-brand-700">
          {t.nav.home}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-700">{t.nav.listings}</span>
      </nav>

      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{t.nav.listings}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {t.meta.listingsDescription}
      </p>

      <div className="mt-6">
        <SearchForm locale={locale} districts={districts} values={values} />
      </div>

      <p className="mt-6 text-sm font-medium text-slate-600">{t.search.results(total)}</p>

      {listings.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          {t.search.empty}
        </p>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Sahifalar">
          {page > 1 && (
            <Link href={buildPageHref(page - 1)} className="btn-secondary" rel="prev">
              ←
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((num) => num === 1 || num === totalPages || Math.abs(num - page) <= 1)
            .map((num, index, arr) => (
              <span key={num} className="flex items-center gap-1">
                {index > 0 && arr[index - 1] !== num - 1 && (
                  <span className="px-1 text-slate-400">…</span>
                )}
                <Link
                  href={buildPageHref(num)}
                  aria-current={num === page ? "page" : undefined}
                  className={
                    num === page
                      ? "btn bg-brand-600 text-white"
                      : "btn border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }
                >
                  {num}
                </Link>
              </span>
            ))}
          {page < totalPages && (
            <Link href={buildPageHref(page + 1)} className="btn-secondary" rel="next">
              →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
