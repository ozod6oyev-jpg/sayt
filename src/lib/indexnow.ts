import { siteUrl } from "./seo";

/**
 * IndexNow kaliti. `public/<kalit>.txt` faylida ham aynan shu qiymat turadi —
 * qidiruv tizimi kalitning saytga tegishli ekanini shu fayl orqali tekshiradi.
 */
export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY?.trim() || "8f4c1d2b7a9e4c3f8b6d5a1e2c9f7b3d";

export function indexNowKeyLocation(): string {
  return `${siteUrl}/${INDEXNOW_KEY}.txt`;
}

/**
 * Yangi yoki o'zgargan sahifalar haqida IndexNow orqali xabar beradi
 * (Bing, Yandex va boshqa IndexNow qo'llab-quvvatlaydigan qidiruv tizimlari).
 * Google bu protokolni qo'llamaydi — u sitemap va ichki havolalar orqali topadi.
 */
export async function notifyIndexNow(paths: string[]): Promise<void> {
  const urls = [...new Set(paths.filter(Boolean).map((path) => (path.startsWith("http") ? path : `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`)))];

  if (urls.length === 0) return;

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(siteUrl).host,
        key: INDEXNOW_KEY,
        keyLocation: indexNowKeyLocation(),
        urlList: urls,
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
  } catch {
    // Qidiruv tizimi javob bermasa ham e'lon saytda va sitemap'da qoladi
  }
}
