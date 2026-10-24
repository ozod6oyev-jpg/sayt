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

  return {
    openGraph: {
      type,
      title,
      description,
      url: absoluteUrl(path),
      siteName,
      locale: ogLocale,
      ...(image ? { images: [{ url: absoluteUrl(image), width: 1200, height: 800 }] } : {}),
      ...(type === "article" && publishedTime
        ? { publishedTime, modifiedTime, authors: author ? [author] : undefined }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [absoluteUrl(image)] } : {}),
    },
  };
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
