import type { Metadata } from "next";
import type { Locale } from "./i18n";
import { siteName } from "./i18n";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

/** Ikki til uchun hreflang havolalari. path — tilsiz yo'l, masalan "/elonlar" */
export function languageAlternates(path: string): Record<string, string> {
  return {
    uz: `${siteUrl}/uz${path}`,
    ru: `${siteUrl}/ru${path}`,
    "x-default": `${siteUrl}/uz${path}`,
  };
}

export function alternatesFor(
  locale: Locale,
  path: string,
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: `${siteUrl}/${locale}${path}`,
    languages: languageAlternates(path),
  };
}

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Open Graph + Twitter kartochkalari */
export function socialMetadata(options: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  locale: Locale;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}): Metadata {
  const {
    title,
    description,
    path,
    image,
    type = "website",
    locale,
    publishedTime,
    modifiedTime,
    author,
  } = options;

  const ogLocale = locale === "uz" ? "uz_UZ" : "ru_RU";
  const ogImage = image ?? "/og-default.jpg";

  return {
    openGraph: {
      type,
      title,
      description,
      url: absoluteUrl(path),
      siteName,
      locale: ogLocale,
      images: [
        {
          url: absoluteUrl(ogImage),
          ...(image ? {} : { width: 1200, height: 630 }),
        },
      ],
      ...(type === "article" && publishedTime
        ? { publishedTime, modifiedTime, authors: author ? [author] : undefined }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(ogImage)],
    },
  };
}

/**
 * E'lon tavsifidan qidiruv kalit so'zlarini ajratadi: takrorlanmaydigan,
 * 3+ harfli so'zlar — eng ko'p uchragani oldinda.
 */
export function keywordsFrom(text: string, limit = 20): string[] {
  const stopWords = new Set([
    "va", "bilan", "uchun", "ham", "bu", "shu", "bir", "bor", "yoq", "juda",
    "yoki", "ammo", "lekin", "keyin", "oldin", "eng", "har", "kabi", "deb",
    "esa", "faqat", "barcha", "hamma", "mavjud", "joylashgan", "ichida",
    "ustida", "ostida", "yaqin", "hamda", "singari", "o'z", "oz",
    "и", "в", "на", "с", "по", "для", "от", "до", "что", "как", "это", "не",
    "или", "а", "но", "из", "к", "у", "же", "есть", "также", "очень", "при",
    "около", "после", "перед", "между", "свой", "свои", "этот", "эта", "все",
    "весь", "который", "которые", "где", "когда", "чтобы", "они", "он", "она",
    "мы", "вы", "я", "ты", "данный", "данного", "также",
  ]);

  const counts = new Map<string, number>();

  for (const word of text.toLowerCase().match(/[a-zа-яё‘’ʻ'’-]{3,}/g) ?? []) {
    if (stopWords.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Discover uchun muhim: max-image-preview:large bo'lmasa katta rasmlar
 * qidiruv natijasida ko'rinmaydi.
 */
export const robotsMeta = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
} satisfies NonNullable<Metadata["robots"]>;
