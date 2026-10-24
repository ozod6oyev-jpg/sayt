import type { Prisma } from "@prisma/client";
import type { SearchParams } from "@/components/search-form";

export const LISTINGS_PER_PAGE = 5;
export const ARTICLES_PER_PAGE = 5;

const PROPERTY_TYPES = ["apartment", "house", "land", "commercial"] as const;

// SQLite Int64 chegarasidan oshib ketmasligi uchun narxni cheklaymiz
const MAX_PRICE = 1_000_000_000_000_000;

function priceValue(raw: string | undefined): bigint | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return BigInt(Math.trunc(Math.min(value, MAX_PRICE)));
}

export function listingWhere(values: SearchParams): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: "active" };

  if (values.propertyType && PROPERTY_TYPES.includes(values.propertyType as never)) {
    where.propertyType = values.propertyType;
  }

  if (values.district) {
    where.district = values.district;
  }

  if (values.rooms) {
    if (values.rooms === "5+") {
      where.rooms = { gte: 5 };
    } else {
      const rooms = Number(values.rooms);
      if (Number.isFinite(rooms) && rooms >= 0 && rooms <= 50) {
        where.rooms = Math.trunc(rooms);
      }
    }
  }

  const priceFilter: { gte?: bigint; lte?: bigint } = {};
  const min = priceValue(values.minPrice);
  const max = priceValue(values.maxPrice);
  if (min !== null) priceFilter.gte = min;
  if (max !== null) priceFilter.lte = max;
  if (priceFilter.gte !== undefined || priceFilter.lte !== undefined) {
    where.price = priceFilter;
  }

  return where;
}
