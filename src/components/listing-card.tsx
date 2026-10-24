import Image from "next/image";
import Link from "next/link";
import { BedDouble, Layers3, MapPin, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatArea, formatNumber } from "@/lib/format";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import type { ListingCardData } from "@/lib/listing-view";

export function ListingCard({
  listing,
  locale,
}: {
  listing: ListingCardData;
  locale: Locale;
}) {
  const t = getDict(locale);
  const cover = listing.cover;

  return (
    <Card className="group gap-0 overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float">
      <Link href={localePath(locale, `/elonlar/${listing.slug}`)} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted sm:aspect-[16/10]">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || listing.title}
              width={cover.width}
              height={cover.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t.admin.noPhotos}
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 flex gap-1">
            <Badge className="shadow-sm">{listing.saleLabel}</Badge>
            <Badge variant="glass" className="shadow-sm">
              {listing.propertyLabel}
            </Badge>
          </div>

          {listing.sold && (
            <Badge variant="dark" className="absolute top-3 right-3">
              {t.listing.sold}
            </Badge>
          )}
        </div>

        <div className="p-3 sm:p-3.5">
          <p className="font-display text-[15px] font-extrabold tracking-tight text-brand-800 sm:text-[17px]">
            {listing.price}
          </p>

          <h3 className="mt-1 line-clamp-2 text-xs leading-[1.35] font-semibold text-slate-800 transition-colors group-hover:text-brand-700 sm:text-[13.5px] sm:leading-5">
            {listing.title}
          </h3>

          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-3 shrink-0 text-brand-500" />
            {listing.district}, {listing.region}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-1 border-t border-border pt-2.5 text-[10px] font-medium text-slate-600 sm:text-[10.5px]">
            {listing.rooms != null && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5">
                <BedDouble className="size-3 text-slate-400" />
                {formatNumber(listing.rooms, locale)} {t.listing.rooms.toLowerCase()}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5">
              <Maximize2 className="size-3 text-slate-400" />
              {formatArea(listing.area, locale)}
            </span>
            {listing.floor != null && (
              <span className="hidden items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 sm:inline-flex">
                <Layers3 className="size-3 text-slate-400" />
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
