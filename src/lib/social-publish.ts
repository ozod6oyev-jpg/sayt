import { readFile } from "fs/promises";
import path from "path";
import { getMetaSettings, metaBaseUrl } from "./meta";
import { publishThreadsMedia } from "./threads";
import { uploadsRoot } from "./uploads";

/**
 * Bitta media faylni Instagram va Facebook'ning turli formatlariga joylash.
 * Har bir format alohida chaqiriladi — biri yiqilsa, qolganlari davom etadi.
 */

export type SocialKind =
  | "ig_reel"
  | "ig_post"
  | "ig_story"
  | "fb_reel"
  | "fb_post"
  | "fb_story"
  | "threads_post";
export type MediaKind = "video" | "image";

export type SocialMedia = {
  type: MediaKind;
  /** /uploads/xxx.mp4 — Meta tashqaridan o'qiy oladigan mutlaq manzilga aylantiriladi */
  url: string;
  localPath: string;
};

export type PublishResult = { ok: true; id: string | null } | { ok: false; error: string };

/** Meta ilovasi so'raydigan qo'shimcha maydonlar */
export type PublishOptions = {
  /** Instagram/Facebook joylashuv ID */
  locationId?: string;
  /** Rasm uchun muqobil matn */
  altText?: string;
  /** Reels muqovasi — videoning nechanchi sekundidan olinadi */
  coverOffset?: number | null;
  /** Reels feed'da ham ko'rinsinmi */
  shareToFeed?: boolean;
  /** Instagram hamkorlari (@username, vergul bilan) */
  collaborators?: string;
  /** Facebook uchun alohida tavsif va video sarlavhasi */
  captionFb?: string;
  fbTitle?: string;
  /** Threads: kimlar javob yozishi mumkin */
  threadsReply?: string;
  /** Threads mavzu tegi */
  threadsTopic?: string;
};

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v21.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const RUPLOAD = `https://rupload.facebook.com/video-upload/${GRAPH_VERSION}`;

/** Media uchun tashqaridan ochiq manzil (Meta shu URL'dan yuklab oladi) */
export function publicMediaUrl(url: string): string {
  return `${metaBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}

type GraphPayload = {
  id?: string;
  video_id?: string;
  post_id?: string;
  status_code?: string;
  status?: string;
  error?: { message?: string; error_user_msg?: string };
};

function payloadError(payload: GraphPayload | null, status: number): string {
  return (
    payload?.error?.error_user_msg ??
    payload?.error?.message ??
    `Graph API xatosi (${status})`
  );
}

async function graphPost(
  endpoint: string,
  token: string,
  params: Record<string, string>,
): Promise<{ ok: true; data: GraphPayload } | { ok: false; error: string }> {
  const body = new URLSearchParams({ ...params, access_token: token });

  try {
    const response = await fetch(`${GRAPH}/${endpoint.replace(/^\//, "")}`, {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });
    const payload = (await response.json().catch(() => null)) as GraphPayload | null;

    if (!response.ok || !payload || payload.error) {
      return { ok: false, error: payloadError(payload, response.status) };
    }

    return { ok: true, data: payload };
  } catch {
    return { ok: false, error: "Meta bilan aloqa yo'q" };
  }
}

async function graphGet(
  endpoint: string,
  token: string,
  params: Record<string, string>,
): Promise<{ ok: true; data: GraphPayload } | { ok: false; error: string }> {
  const url = new URL(`${GRAPH}/${endpoint.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const payload = (await response.json().catch(() => null)) as GraphPayload | null;

    if (!response.ok || !payload || payload.error) {
      return { ok: false, error: payloadError(payload, response.status) };
    }

    return { ok: true, data: payload };
  } catch {
    return { ok: false, error: "Meta bilan aloqa yo'q" };
  }
}

/** Instagram video konteyneri tayyor bo'lishini kutadi */
async function waitForInstagramContainer(
  containerId: string,
  token: string,
): Promise<PublishResult> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const status = await graphGet(containerId, token, { fields: "status_code,status" });

    if (!status.ok) return { ok: false, error: status.error };

    const code = status.data.status_code;
    if (code === "FINISHED") return { ok: true, id: containerId };
    if (code === "ERROR" || code === "EXPIRED") {
      return { ok: false, error: status.data.status ?? "Instagram videoni qayta ishlay olmadi" };
    }

    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }

  return { ok: false, error: "Instagram video tayyor bo'lmadi (vaqt tugadi)" };
}

async function publishInstagram(
  kind: "ig_reel" | "ig_post" | "ig_story",
  media: SocialMedia,
  caption: string,
  options: PublishOptions,
): Promise<PublishResult> {
  const settings = await getMetaSettings();
  if (!settings.igUserId || !settings.pageToken) {
    return { ok: false, error: "Instagram akkaunti ulanmagan" };
  }

  const isStory = kind === "ig_story";
  const mediaType = isStory ? "STORIES" : media.type === "video" ? "REELS" : "IMAGE";

  const params: Record<string, string> = { media_type: mediaType };
  if (media.type === "video") {
    params.video_url = publicMediaUrl(media.url);
  } else {
    params.image_url = publicMediaUrl(media.url);
  }
  if (!isStory && caption) params.caption = caption;
  if (options.locationId) params.location_id = options.locationId;
  if (options.altText && media.type === "image") params.alt_text = options.altText;

  // Reels feed'da ham ko'rinsin va muqova sekundi
  if (kind === "ig_reel") {
    params.share_to_feed = options.shareToFeed === false ? "false" : "true";
    if (typeof options.coverOffset === "number" && options.coverOffset >= 0) {
      params.thumb_offset = String(options.coverOffset * 1000);
    }
  }

  // Hamkorlar (collab) — story uchun qo'llanmaydi
  if (!isStory && options.collaborators) {
    params.collaborators = options.collaborators;
  }

  const container = await graphPost(`${settings.igUserId}/media`, settings.pageToken, params);
  if (!container.ok) return { ok: false, error: container.error };

  const containerId = container.data.id;
  if (!containerId) return { ok: false, error: "Instagram konteyner yaratmadi" };

  if (media.type === "video") {
    const ready = await waitForInstagramContainer(containerId, settings.pageToken);
    if (!ready.ok) return ready;
  }

  const published = await graphPost(`${settings.igUserId}/media_publish`, settings.pageToken, {
    creation_id: containerId,
  });

  if (!published.ok) return { ok: false, error: published.error };

  return { ok: true, id: published.data.id ?? null };
}

/** Video faylni Facebook'ning upload serveriga yuboradi */
async function uploadVideoToFacebook(
  videoId: string,
  token: string,
  localPath: string,
): Promise<PublishResult> {
  try {
    const buffer = await readFile(localPath);
    const response = await fetch(`${RUPLOAD}/${videoId}`, {
      method: "POST",
      headers: {
        authorization: `OAuth ${token}`,
        offset: "0",
        file_size: String(buffer.byteLength),
        "content-type": "application/octet-stream",
      },
      body: new Uint8Array(buffer),
      cache: "no-store",
      signal: AbortSignal.timeout(300_000),
    });

    const payload = (await response.json().catch(() => null)) as GraphPayload | null;
    if (!response.ok || !payload || payload.error) {
      return { ok: false, error: payloadError(payload, response.status) };
    }

    return { ok: true, id: videoId };
  } catch {
    return { ok: false, error: "Videoni Facebook'ga yuklab bo'lmadi" };
  }
}

async function publishFacebookVideo(
  kind: "fb_reel" | "fb_post" | "fb_story",
  pageId: string,
  token: string,
  media: SocialMedia,
  caption: string,
  options: PublishOptions,
): Promise<PublishResult> {
  if (kind === "fb_post") {
    // Feed'dagi video: sahifa o'zi URL'dan yuklab oladi
    const result = await graphPost(`${pageId}/videos`, token, {
      file_url: publicMediaUrl(media.url),
      description: caption,
      ...(options.fbTitle ? { title: options.fbTitle } : {}),
      ...(options.locationId ? { place: options.locationId } : {}),
    });
    return result.ok ? { ok: true, id: result.data.id ?? null } : { ok: false, error: result.error };
  }

  const endpoint = kind === "fb_reel" ? `${pageId}/video_reels` : `${pageId}/video_stories`;

  const started = await graphPost(endpoint, token, { upload_phase: "start" });
  if (!started.ok) return { ok: false, error: started.error };

  const videoId = started.data.video_id ?? started.data.id;
  if (!videoId) return { ok: false, error: "Facebook video ID qaytarmadi" };

  const uploaded = await uploadVideoToFacebook(videoId, token, media.localPath);
  if (!uploaded.ok) return uploaded;

  const finished = await graphPost(endpoint, token, {
    upload_phase: "finish",
    video_id: videoId,
    video_state: "PUBLISHED",
    description: caption,
  });

  if (!finished.ok) return { ok: false, error: finished.error };

  return { ok: true, id: videoId };
}

async function publishFacebookImage(
  kind: "fb_post" | "fb_story",
  pageId: string,
  token: string,
  media: SocialMedia,
  caption: string,
  options: PublishOptions,
): Promise<PublishResult> {
  if (kind === "fb_post") {
    const result = await graphPost(`${pageId}/photos`, token, {
      url: publicMediaUrl(media.url),
      message: caption,
      ...(options.locationId ? { place: options.locationId } : {}),
    });
    return result.ok ? { ok: true, id: result.data.id ?? null } : { ok: false, error: result.error };
  }

  // Story uchun rasm avval e'lon qilinmagan holda yuklanadi
  const photo = await graphPost(`${pageId}/photos`, token, {
    url: publicMediaUrl(media.url),
    published: "false",
  });
  if (!photo.ok) return { ok: false, error: photo.error };

  const photoId = photo.data.id;
  if (!photoId) return { ok: false, error: "Facebook rasm ID qaytarmadi" };

  const story = await graphPost(`${pageId}/photo_stories`, token, { photo_id: photoId });
  return story.ok ? { ok: true, id: story.data.post_id ?? photoId } : { ok: false, error: story.error };
}

/** Tanlangan formatga media'ni joylaydi */
export async function publishToTarget(
  kind: SocialKind,
  media: SocialMedia,
  caption: string,
  options: PublishOptions = {},
): Promise<PublishResult> {
  const settings = await getMetaSettings();
  const fbCaption = options.captionFb?.trim() || caption;

  if (kind === "threads_post") {
    const result = await publishThreadsMedia({
      text: caption,
      ...(media.type === "video"
        ? { videoUrl: publicMediaUrl(media.url) }
        : { imageUrl: publicMediaUrl(media.url) }),
      ...(options.threadsReply ? { replyControl: options.threadsReply } : {}),
      ...(options.threadsTopic ? { topicTag: options.threadsTopic } : {}),
    });

    return result.ok
      ? { ok: true, id: result.result.id ?? null }
      : { ok: false, error: result.description };
  }

  if (kind.startsWith("ig_")) {
    return publishInstagram(kind as "ig_reel" | "ig_post" | "ig_story", media, caption, options);
  }

  if (!settings.pageId || !settings.pageToken) {
    return { ok: false, error: "Facebook sahifasi ulanmagan" };
  }

  if (media.type === "video") {
    return publishFacebookVideo(
      kind as "fb_reel" | "fb_post" | "fb_story",
      settings.pageId,
      settings.pageToken,
      media,
      fbCaption,
      options,
    );
  }

  if (kind === "fb_reel") {
    return { ok: false, error: "Reels uchun video kerak" };
  }

  return publishFacebookImage(
    kind as "fb_post" | "fb_story",
    settings.pageId,
    settings.pageToken,
    media,
    fbCaption,
    options,
  );
}

/** /uploads/xxx → diskdagi to'liq yo'l */
export function localMediaPath(url: string): string {
  return path.join(uploadsRoot(), path.basename(url));
}
