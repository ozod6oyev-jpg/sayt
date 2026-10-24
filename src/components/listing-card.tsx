import type { Listing, Photo } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { BedDouble, Layers3, MapPin, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listingTitle } from "@/lib/content";
import { formatArea, formatNumber, formatPrice } from "@/lib/format";
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
    <Card className="group gap-0 overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float">
      <Link href={localePath(locale, `/elonlar/${listing.slug}`)} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || listingTitle(listing, locale)}
              width={cover.width}
              height={cover.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t.admin.noPhotos}
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge className="shadow-sm">
              {t.listingType[listing.type as keyof typeof t.listingType] ?? listing.type}
            </Badge>
            <Badge variant="glass" className="shadow-sm">
              {t.propertyType[listing.propertyType as keyof typeof t.propertyType] ??
                listing.propertyType}
            </Badge>
          </div>

          {listing.status === "sold" && (
            <Badge variant="dark" className="absolute top-3 right-3">
              {t.listing.sold}
            </Badge>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <p className="font-display text-xl font-extrabold tracking-tight text-brand-800">
            {formatPrice(listing.price, listing.currency, locale)}
          </p>

          <h3 className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-[15px] leading-6 font-semibold text-slate-800 transition-colors group-hover:text-brand-700">
            {listingTitle(listing, locale)}
          </h3>

          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-brand-500" />
            {listing.district}, {listing.region}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3 text-[11px] font-medium text-slate-600">
            {listing.rooms != null && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
                <BedDouble className="size-3.5 text-slate-400" />
                {formatNumber(listing.rooms, locale)} {t.listing.rooms.toLowerCase()}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
              <Maximize2 className="size-3.5 text-slate-400" />
              {formatArea(listing.area, locale)}
            </span>
            {listing.floor != null && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
                <Layers3 className="size-3.5 text-slate-400" />
                {formatNumber(listing.floor, locale)}
                {listing.totalFloors ? `/${formatNumber(listing.totalFloors, locale)}` : ""}{" "}
                {t.listing.floor.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
