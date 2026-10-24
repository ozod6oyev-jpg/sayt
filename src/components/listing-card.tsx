import type { Listing, Photo } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { listingTitle } from "@/lib/content";
import { formatArea, formatNumber, formatPrice } from "@/lib/format";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import { MapPinIcon } from "./icons";

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
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float">
      <Link href={localePath(locale, `/elonlar/${listing.slug}`)} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || listingTitle(listing, locale)}
              width={cover.width}
              height={cover.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              {t.admin.noPhotos}
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="rounded-full bg-brand-800 px-2.5 py-1 text-[11px] font-semibold text-white">
              {t.listingType[listing.type as keyof typeof t.listingType] ?? listing.type}
            </span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
              {t.propertyType[listing.propertyType as keyof typeof t.propertyType] ??
                listing.propertyType}
            </span>
          </div>

          {listing.status === "sold" && (
            <span className="absolute top-3 right-3 rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-white">
              {t.listing.sold}
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xl font-extrabold tracking-tight text-brand-800">
            {formatPrice(listing.price, listing.currency, locale)}
          </p>

          <h3 className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-[15px] leading-6 font-semibold text-slate-800 transition-colors group-hover:text-brand-700">
            {listingTitle(listing, locale)}
          </h3>

          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
            {listing.district}, {listing.region}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-600">
            {listing.rooms != null && (
              <span className="rounded-lg bg-slate-50 px-2 py-1">
                {formatNumber(listing.rooms, locale)} {t.listing.rooms.toLowerCase()}
              </span>
            )}
            <span className="rounded-lg bg-slate-50 px-2 py-1">
              {formatArea(listing.area, locale)}
            </span>
            {listing.floor != null && (
              <span className="rounded-lg bg-slate-50 px-2 py-1">
                {formatNumber(listing.floor, locale)}
                {listing.totalFloors ? `/${formatNumber(listing.totalFloors, locale)}` : ""}{" "}
                {t.listing.floor.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
