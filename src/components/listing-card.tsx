import type { Listing, Photo } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { listingTitle } from "@/lib/content";
import { formatArea, formatPrice } from "@/lib/format";
import { getDict, localePath, type Locale } from "@/lib/i18n";

export type ListingWithPhotos = Listing & { photos: Photo[] };

export function ListingCard({
  listing,
  locale,
}: {
  listing: ListingWithPhotos;
  locale: Locale;
}) {
  const t = getDict(locale);
  const cover = listing.photos[0];

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
      <Link href={localePath(locale, `/elonlar/${listing.slug}`)} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || listingTitle(listing, locale)}
              width={cover.width}
              height={cover.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              {t.admin.noPhotos}
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {t.listingType[listing.type as keyof typeof t.listingType] ?? listing.type}
            </span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {t.propertyType[listing.propertyType as keyof typeof t.propertyType] ??
                listing.propertyType}
            </span>
          </div>

          {listing.status === "sold" && (
            <span className="absolute top-3 right-3 rounded-full bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-white">
              {t.listing.sold}
            </span>
          )}
        </div>

        <div className="p-4">
          <p className="text-lg font-bold text-slate-900">
            {formatPrice(listing.price, listing.currency, locale)}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-brand-700">
            {listingTitle(listing, locale)}
          </h3>

          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span aria-hidden="true">📍</span>
            {listing.district}, {listing.region}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
            {listing.rooms != null && (
              <span>
                {listing.rooms} {t.listing.rooms.toLowerCase()}
              </span>
            )}
            <span>{formatArea(listing.area, locale)}</span>
            {listing.floor != null && (
              <span>
                {listing.floor}
                {listing.totalFloors ? `/${listing.totalFloors}` : ""} {t.listing.floor.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
