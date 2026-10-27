import { getChannelInfo, getChannelMemberCount } from "./telegram";

/** Kanaldagi postlar t.me ommaviy ko'rinishidan olinadi — Bot API tarixni bermaydi */
export type TelegramPostItem = {
  id: string;
  url: string;
  text: string;
  imageUrl: string | null;
  date: string | null;
  views: number | null;
};

export type TelegramOverview = {
  title: string;
  username: string | null;
  avatar: string | null;
  subscribers: number | null;
  posts: TelegramPostItem[];
};

const CACHE_MS = 5 * 60 * 1000;

let cache: { at: number; key: string; value: TelegramOverview | null } | null = null;

function decodeText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "1.2K" / "12,5K" / "3.4M" kabi yozuvlarni songa aylantiradi */
function parseViews(value: string | undefined): number | null {
  if (!value) return null;

  const raw = value.trim().toUpperCase().replace(/\s+/g, "");
  const number = Number.parseFloat(raw.replace(/,/g, ".").replace(/[KM]$/, ""));
  if (!Number.isFinite(number)) return null;

  if (raw.endsWith("M")) return Math.round(number * 1_000_000);
  if (raw.endsWith("K")) return Math.round(number * 1_000);
  return Math.round(number);
}

function parseCount(value: string | undefined): number | null {
  if (!value) return null;
  const number = Number.parseFloat(value.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(number) ? Math.round(number) : null;
}

function parsePosts(html: string): TelegramPostItem[] {
  const posts: TelegramPostItem[] = [];
  const markers = [...html.matchAll(/data-post="([^"]+)"/g)];

  markers.forEach((marker, index) => {
    const start = marker.index ?? 0;
    const end = index + 1 < markers.length ? (markers[index + 1].index ?? html.length) : html.length;
    const block = html.slice(start, end);

    const image =
      block.match(/background-image:url\((['"]?)([^'")]+)\1\)/)?.[2]?.replace(/\\\//g, "/") ?? null;
    const text = decodeText(
      block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "",
    );

    posts.push({
      id: marker[1],
      url: `https://t.me/${marker[1]}`,
      text: text.slice(0, 180),
      imageUrl: image,
      date: block.match(/<time datetime="([^"]+)"/)?.[1] ?? null,
      views: parseViews(block.match(/tgme_widget_message_views">([^<]+)</)?.[1]),
    });
  });

  return posts;
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36";

async function fetchPreview(username: string): Promise<{
  avatar: string | null;
  subscribers: number | null;
  posts: TelegramPostItem[];
} | null> {
  try {
    const response = await fetch(`https://t.me/s/${encodeURIComponent(username)}`, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;

    const html = await response.text();

    return {
      avatar:
        html
          .match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1]
          ?.replace(/&amp;/g, "&") ?? null,
      subscribers: parseCount(
        html.match(/([\d\s.,]+)\s*(subscribers|obunachi|подписчик)/i)?.[1],
      ),
      posts: parsePosts(html),
    };
  } catch {
    return null;
  }
}

/** Ulangan Telegram kanali: avatar, obunachilar va oxirgi postlar (ko'rishlar bilan) */
export async function getTelegramOverview(limit = 12): Promise<TelegramOverview | null> {
  const channel = await getChannelInfo();
  if (!channel.ok) return null;

  const username = channel.result.username ?? null;
  const cacheKey = `${channel.result.id}:${username ?? ""}:${limit}`;

  if (cache && cache.key === cacheKey && Date.now() - cache.at < CACHE_MS) return cache.value;

  const [members, preview] = await Promise.all([
    getChannelMemberCount(),
    username ? fetchPreview(username) : Promise.resolve(null),
  ]);

  const value: TelegramOverview = {
    title: channel.result.title,
    username,
    avatar: preview?.avatar ?? null,
    subscribers: members.ok ? members.result : (preview?.subscribers ?? null),
    posts: (preview?.posts ?? []).slice(-limit).reverse(),
  };

  cache = { at: Date.now(), key: cacheKey, value };

  return value;
}
