import { getMetaSettings } from "./meta";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v21.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type SocialMediaItem = {
  id: string;
  caption: string;
  mediaType: string;
  imageUrl: string | null;
  permalink: string | null;
  timestamp: string | null;
  likes: number | null;
  comments: number | null;
  views: number | null;
};

export type InstagramOverview = {
  username: string | null;
  name: string | null;
  avatar: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  biography: string | null;
  media: SocialMediaItem[];
};

export type FacebookOverview = {
  name: string;
  username: string | null;
  avatar: string | null;
  followers: number | null;
  likes: number | null;
  posts: number | null;
  media: SocialMediaItem[];
};

export type SocialOverview = {
  instagram: InstagramOverview | null;
  facebook: FacebookOverview | null;
};

async function graphGet<T>(url: URL, token: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;
    const body = (await response.json().catch(() => null)) as (T & { error?: unknown }) | null;
    if (!body || body.error) return null;
    return body;
  } catch {
    return null;
  }
}

type IgMediaResponse = {
  data?: {
    id?: string;
    caption?: string;
    media_type?: string;
    media_url?: string;
    thumbnail_url?: string;
    permalink?: string;
    timestamp?: string;
    like_count?: number;
    comments_count?: number;
  }[];
  paging?: { next?: string };
};

function mapIgMedia(payload: IgMediaResponse | null): SocialMediaItem[] {
  return (payload?.data ?? [])
    .filter((item) => item.id)
    .map((item) => ({
      id: item.id as string,
      caption: item.caption ?? "",
      mediaType: item.media_type ?? "IMAGE",
      imageUrl:
        item.media_type === "VIDEO"
          ? (item.thumbnail_url ?? item.media_url ?? null)
          : (item.media_url ?? item.thumbnail_url ?? null),
      permalink: item.permalink ?? null,
      timestamp: item.timestamp ?? null,
      likes: item.like_count ?? null,
      comments: item.comments_count ?? null,
      views: null,
    }));
}

/** Instagram akkauntning postlari (sahifalab, limitgacha) */
export async function getInstagramMedia(limit = 48): Promise<SocialMediaItem[]> {
  const settings = await getMetaSettings();
  if (!settings.igUserId || !settings.pageToken) return [];

  const items: SocialMediaItem[] = [];
  let next: string | null = null;
  let pages = 0;

  while (items.length < limit && pages < 4) {
    const url: URL = next
      ? new URL(next)
      : (() => {
          const first = new URL(`${GRAPH}/${settings.igUserId}/media`);
          first.searchParams.set(
            "fields",
            "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
          );
          first.searchParams.set("limit", "25");
          return first;
        })();

    const payload = await graphGet<IgMediaResponse>(url, settings.pageToken);
    if (!payload) break;

    items.push(...mapIgMedia(payload));
    next = payload.paging?.next ?? null;
    pages += 1;

    if (!next) break;
  }

  return items.slice(0, limit);
}

type IgInsightsResponse = {
  data?: { name?: string; values?: { value?: number }[] }[];
  error?: { code?: number; message?: string };
};

/** Ko'rishlar soni 10 daqiqa davomida keshlanadi — har sahifa ochilishida qayta so'ralmaydi */
const VIEWS_TTL_MS = 10 * 60 * 1000;
const viewsCache = new Map<string, { views: number | null; at: number }>();

/** Bitta postning ko'rishlar soni (ruxsat bo'lmasa `denied` qaytadi) */
async function mediaViews(
  mediaId: string,
  token: string,
): Promise<{ views: number | null; denied: boolean }> {
  const cached = viewsCache.get(mediaId);
  if (cached && Date.now() - cached.at < VIEWS_TTL_MS) {
    return { views: cached.views, denied: false };
  }

  for (const metric of ["views", "impressions"]) {
    try {
      const url = new URL(`${GRAPH}/${mediaId}/insights`);
      url.searchParams.set("metric", metric);

      const response = await fetch(url, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await response.json().catch(() => null)) as IgInsightsResponse | null;

      if (!response.ok || body?.error) {
        const code = body?.error?.code;
        // Ruxsat yo'q / token eskirgan — qolgan postlarni so'rab o'tirmaymiz
        if (code === 10 || code === 190 || code === 200 || code === 230) {
          return { views: null, denied: true };
        }
        continue;
      }

      const value = body?.data?.find((row) => row.name === metric)?.values?.[0]?.value;
      if (typeof value === "number") {
        viewsCache.set(mediaId, { views: value, at: Date.now() });
        return { views: value, denied: false };
      }
    } catch {
      continue;
    }
  }

  viewsCache.set(mediaId, { views: null, at: Date.now() });
  return { views: null, denied: false };
}

/** Postlar ro'yxatiga ko'rishlar sonini qo'shadi (ruxsat bo'lmasa jim o'tadi) */
async function attachViews(items: SocialMediaItem[], token: string): Promise<void> {
  const batchSize = 4;

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const results = await Promise.all(batch.map((item) => mediaViews(item.id, token)));

    results.forEach((result, offset) => {
      batch[offset].views = result.views;
    });

    if (results.every((result) => result.denied)) return;
  }
}

type IgProfileResponse = {
  username?: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  biography?: string;
};

type FbPageResponse = {
  name?: string;
  username?: string;
  fan_count?: number;
  followers_count?: number;
  picture?: { data?: { url?: string } };
};

type FbPostsResponse = {
  summary?: { total_count?: number };
  data?: {
    id?: string;
    message?: string;
    full_picture?: string;
    permalink_url?: string;
    created_time?: string;
    reactions?: { summary?: { total_count?: number } };
    comments?: { summary?: { total_count?: number } };
  }[];
};

async function getFacebookPages(
  token: string,
  pageId: string,
  limit: number,
): Promise<FacebookOverview | null> {
  const pageUrl = new URL(`${GRAPH}/${pageId}`);
  pageUrl.searchParams.set("fields", "name,username,fan_count,followers_count,picture{url}");
  const page = await graphGet<FbPageResponse>(pageUrl, token);
  if (!page?.name) return null;

  const postsUrl = new URL(`${GRAPH}/${pageId}/posts`);
  postsUrl.searchParams.set(
    "fields",
    "id,message,full_picture,permalink_url,created_time,reactions.summary(true),comments.summary(true)",
  );
  postsUrl.searchParams.set("limit", String(limit));
  postsUrl.searchParams.set("summary", "true");
  const posts = await graphGet<FbPostsResponse>(postsUrl, token);

  const media = (posts?.data ?? [])
    .filter((item) => item.id)
    .map((item) => ({
      id: item.id as string,
      caption: item.message ?? "",
      mediaType: "POST",
      imageUrl: item.full_picture ?? null,
      permalink: item.permalink_url ?? null,
      timestamp: item.created_time ?? null,
      likes: item.reactions?.summary?.total_count ?? null,
      comments: item.comments?.summary?.total_count ?? null,
      views: null,
    }));

  return {
    name: page.name as string,
    username: page.username ?? null,
    avatar: page.picture?.data?.url ?? null,
    followers: page.followers_count ?? 0,
    likes: page.fan_count ?? 0,
    posts: posts?.summary?.total_count ?? media.length,
    media,
  };
}

/** Ulangan Instagram akkaunt va Facebook sahifa haqida ma'lumot + oxirgi postlar */
export async function getSocialOverview(limit = 36): Promise<SocialOverview> {
  const settings = await getMetaSettings();
  const token = settings.pageToken;
  if (!token) return { instagram: null, facebook: null };

  let instagram: InstagramOverview | null = null;
  if (settings.igUserId) {
    const profileUrl = new URL(`${GRAPH}/${settings.igUserId}`);
    profileUrl.searchParams.set(
      "fields",
      "username,name,profile_picture_url,followers_count,follows_count,media_count,biography",
    );

    const profile = await graphGet<IgProfileResponse>(profileUrl, token);

    const mediaUrl = new URL(`${GRAPH}/${settings.igUserId}/media`);
    mediaUrl.searchParams.set(
      "fields",
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
    );
    mediaUrl.searchParams.set("limit", String(limit));

    const media = await graphGet<IgMediaResponse>(mediaUrl, token);

    instagram = {
      username: profile?.username ?? settings.igUsername?.replace(/^@/, "") ?? null,
      name: profile?.name ?? null,
      avatar: profile?.profile_picture_url ?? null,
      followers: profile?.followers_count ?? 0,
      following: profile?.follows_count ?? 0,
      posts: profile?.media_count ?? 0,
      biography: profile?.biography ?? null,
      media: mapIgMedia(media),
    };

    await attachViews(instagram.media, token);
  }

  const facebook = settings.pageId
    ? ((await getFacebookPages(token, settings.pageId, limit)) ??
      (settings.pageName
        ? {
            name: settings.pageName,
            username: null,
            avatar: null,
            followers: 0,
            likes: 0,
            posts: 0,
            media: [],
          }
        : null))
    : null;

  return { instagram, facebook };
}
