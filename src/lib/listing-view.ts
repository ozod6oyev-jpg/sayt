import type { Listing, Photo, SaleOption } from "@prisma/client";
import { listingTitle, saleOptionLabel } from "./content";
import { formatPrice } from "./format";
import { getDict, type Locale } from "./i18n";

export type ListingCardData = {
  id: string;
  slug: string;
  title: string;
  price: string;
  district: string;
  region: string;
  rooms: number | null;
  area: number | null;
  floor: number | null;
  totalFloors: number | null;
  sold: boolean;
  saleLabel: string;
  propertyLabel: string;
  cover: { url: string; width: number; height: number; alt: string } | null;
};

export function toListingCardData(
  listing: Listing & { photos: Photo[]; saleOption?: SaleOption | null },
  locale: Locale,
): ListingCardData {
  const t = getDict(locale);
  const cover = listing.photos[0];

  return {
    id: listing.id,
    slug: listing.slug,
    title: listingTitle(listing, locale),
    price: formatPrice(listing.price, listing.currency, locale),
    district: listing.district,
    region: listing.region,
    rooms: listing.rooms,
    area: listing.area,
    floor: listing.floor,
    totalFloors: listing.totalFloors,
    sold: listing.status === "sold",
    saleLabel: saleOptionLabel(listing.saleOption, locale) ?? t.listing.forSale,
    propertyLabel:
      t.propertyType[listing.propertyType as keyof typeof t.propertyType] ??
      listing.propertyType,
    cover: cover
      ? { url: cover.url, width: cover.width, height: cover.height, alt: cover.alt }
      : null,
  };
}
