import type { Locale } from "./i18n";

export function formatPrice(
  price: bigint | number,
  currency: string,
  locale: Locale,
): string {
  const value = typeof price === "bigint" ? price : BigInt(Math.round(price));
  const formatted = new Intl.NumberFormat("ru-RU").format(value).replace(/\u00A0/g, " ");

  if (currency === "USD") {
    return `$${formatted}`;
  }

  return locale === "ru" ? `${formatted} сум` : `${formatted} so'm`;
}

export function formatNumber(value: number | bigint, locale: Locale): string {
  const intlLocale = locale === "ru" ? "ru-RU" : "uz-UZ";
  return new Intl.NumberFormat(intlLocale).format(value).replace(/\u00A0/g, " ");
}

export function formatDate(date: Date, locale: Locale): string {
  const intlLocale = locale === "ru" ? "ru-RU" : "uz-UZ";
  try {
    return new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }
}

export function formatArea(area: number | null | undefined, locale: Locale): string {
  if (!area) return "—";
  return `${formatNumber(area, locale)} m²`;
}

export function formatFloor(
  floor: number | null | undefined,
  total: number | null | undefined,
  locale: Locale,
): string {
  if (floor == null) return "—";
  if (total == null) return formatNumber(floor, locale);
  return `${formatNumber(floor, locale)} / ${formatNumber(total, locale)}`;
}
