import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { decryptSecret, encryptSecret } from "./crypto";
import { prisma } from "./prisma";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type MetaSettings = {
  appId: string | null;
  appSecret: string | null;
  pageId: string | null;
  pageToken: string | null;
  igUserId: string | null;
  threadsUserId: string | null;
  threadsToken: string | null;
  threadsUsername: string | null;
  pageName: string | null;
  igUsername: string | null;
  verifyToken: string;
  connectedAt: Date | null;
};

export type MetaResult<T> =
  | { ok: true; result: T }
  | { ok: false; description: string; code?: number };

/** Sozlamalar qatorini oladi (bo'lmasa yaratadi) */
export async function getMetaSettings(): Promise<MetaSettings> {
  const existing = await prisma.metaIntegration.findUnique({ where: { id: "default" } });
  const row =
    existing ??
    (await prisma.metaIntegration.create({
      data: { id: "default", verifyToken: randomBytes(16).toString("hex") },
    }));

  return {
    appId: row.appId,
    appSecret: decryptSecret(row.appSecret),
    pageId: row.pageId,
    pageToken: decryptSecret(row.pageToken),
    igUserId: row.igUserId,
    threadsUserId: row.threadsUserId,
    threadsToken: decryptSecret(row.threadsToken),
    threadsUsername: row.threadsUsername,
    pageName: row.pageName,
    igUsername: row.igUsername,
    verifyToken: row.verifyToken,
    connectedAt: row.connectedAt,
  };
}

export async function metaVerifyToken(): Promise<string> {
  return (await getMetaSettings()).verifyToken;
}

/** Tashqi manzil (OAuth redirect va webhook uchun) */
export function metaBaseUrl(): string {
  const base =
    process.env.META_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";
  return base.replace(/\/$/, "");
}

/**
 * Webhook callback manzili. Domen ishga tushmaguncha META_WEBHOOK_URL bilan
 * vaqtincha ishlaydigan manzilga yo'naltirish mumkin.
 */
export function metaCallbackUrl(): string {
  const override = process.env.META_WEBHOOK_URL?.trim();
  if (override) return override;

  return `${metaBaseUrl()}/api/webhooks/meta`;
}

/** Facebook OAuth va Threads OAuth uchun redirect manzillari */
export function metaOAuthUrls(): { facebook: string; threads: string } {
  return {
    facebook: `${metaBaseUrl()}/api/meta/oauth/callback`,
    threads: `${metaBaseUrl()}/api/meta/threads/callback`,
  };
}

/** Bo'sh maydonlar eski qiymatni saqlab qoladi */
export async function saveMetaSettings(input: {
  appId?: string;
  appSecret?: string;
  pageId?: string;
  pageToken?: string;
  igUserId?: string;
  threadsUserId?: string;
  threadsToken?: string;
}): Promise<void> {
  await getMetaSettings();

  const data: Record<string, string | null | Date> = {};

  if (input.appId !== undefined && input.appId !== "") data.appId = input.appId;
  if (input.pageId !== undefined && input.pageId !== "") data.pageId = input.pageId;
  if (input.igUserId !== undefined) data.igUserId = input.igUserId || null;
  if (input.threadsUserId !== undefined) data.threadsUserId = input.threadsUserId || null;
  if (input.appSecret) data.appSecret = encryptSecret(input.appSecret);
  if (input.pageToken) data.pageToken = encryptSecret(input.pageToken);
  if (input.threadsToken) data.threadsToken = encryptSecret(input.threadsToken);

  if (Object.keys(data).length === 0) return;

  await prisma.metaIntegration.update({ where: { id: "default" }, data });
}

export async function clearMetaConnection(): Promise<void> {
  await prisma.metaIntegration.update({
    where: { id: "default" },
    data: { pageName: null, igUsername: null, connectedAt: null },
  });
}

/** Graph API chaqiruvi — token xato matniga tushmaydi */
export async function metaGraph<T>(
  path: string,
  options: { params?: Record<string, string>; token?: string | null; method?: "GET" | "POST"; body?: Record<string, unknown> } = {},
): Promise<MetaResult<T>> {
  const token = options.token ?? (await getMetaSettings()).pageToken;
  if (!token) {
    return { ok: false, description: "Page token o'rnatilmagan" };
  }

  const url = new URL(`${GRAPH_BASE}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(options.params ?? {})) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        // Token sarlavhada yuboriladi, URL'da qolmaydi
        authorization: `Bearer ${token}`,
        ...(options.method === "POST" ? { "content-type": "application/json" } : {}),
      },
      body: options.method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    const payload = (await response.json().catch(() => null)) as
      | (T & { error?: { message?: string; code?: number } })
      | null;

    if (!response.ok || !payload || payload.error) {
      return {
        ok: false,
        description: payload?.error?.message ?? `Graph API xatosi (${response.status})`,
        code: payload?.error?.code,
      };
    }

    return { ok: true, result: payload as T };
  } catch {
    return { ok: false, description: "Meta bilan aloqa yo'q" };
  }
}

/** Instagram akkauntni app webhook'iga obuna qiladi — xabarlar panelga tushishi uchun */
export async function subscribeInstagramWebhooks(igUserId: string, token: string): Promise<void> {
  const result = await metaGraph(`${igUserId}/subscribed_apps`, {
    token,
    method: "POST",
    body: { subscribed_fields: ["messages", "messaging_seen", "message_reactions"] },
  });

  if (!result.ok) {
    console.error("Instagram webhook obunasi xatosi:", result.description);
  }
}

type HistoryMessage = {
  id?: string;
  message?: string;
  created_time?: string;
  from?: { id?: string; username?: string };
  attachments?: { type?: string }[];
};

type HistoryConversation = {
  participants?: { data?: { id?: string; username?: string }[] };
  messages?: { data?: HistoryMessage[]; next?: string };
};

const MEDIA_LABELS: Record<string, string> = {
  image: "[rasm]",
  video: "[video]",
  audio: "[ovozli xabar]",
  file: "[fayl]",
  share: "[havola]",
};

/**
 * Instagram'dagi mavjud suhbatlarni bazaga ko'chiradi: webhook'dan oldingi
 * yozishmalar ham panelda ko'rinadi. Dublikatlar externalId bo'yicha tashlanadi.
 */
export async function importInstagramHistory(): Promise<
  MetaResult<{ chats: number; messages: number; done: boolean }>
> {
  const settings = await getMetaSettings();
  if (!settings.pageId || !settings.pageToken || !settings.igUserId) {
    return { ok: false, description: "Instagram ulanmagan" };
  }

  // Har bosishda bitta sahifa (25 suhbat) — tugma tez javob beradi
  const state = await prisma.metaIntegration.findUnique({
    where: { id: "default" },
    select: { historyCursor: true },
  });
  let next: string | null = state?.historyCursor ?? null;
  let chats = 0;
  let messages = 0;
  let pages = 0;

  do {
    const url = next
      ? new URL(next)
      : (() => {
          const first = new URL(`${GRAPH_BASE}/${settings.pageId}/conversations`);
          first.searchParams.set("platform", "instagram");
          first.searchParams.set("limit", "25");
          first.searchParams.set(
            "fields",
            "participants,messages.limit(15){id,message,from,created_time,attachments}",
          );
          return first;
        })();

    let payload: { data?: HistoryConversation[]; paging?: { next?: string } } | null = null;
    try {
      const response = await fetch(url, {
        headers: { authorization: `Bearer ${settings.pageToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(60_000),
      });
      payload = (await response.json().catch(() => null)) as
        | { data?: HistoryConversation[]; paging?: { next?: string } }
        | null;
      if (!response.ok || !payload) {
        return { ok: false, description: "Instagram suhbatlarini o'qib bo'lmadi" };
      }
    } catch {
      return { ok: false, description: "Meta bilan aloqa yo'q" };
    }

    for (const conversation of payload.data ?? []) {
      const participants = conversation.participants?.data ?? [];
      const customer =
        participants.find((item) => item.id && item.id !== settings.igUserId) ?? participants[0];
      if (!customer?.id) continue;

      const username = customer.username ?? null;
      const name = username ?? `IG · ${customer.id.slice(-6)}`;

      const chat = await prisma.metaChat.upsert({
        where: { platform_externalId: { platform: "instagram", externalId: customer.id } },
        create: {
          platform: "instagram",
          externalId: customer.id,
          name,
          username,
          lastMessageAt: new Date(),
        },
        update: { username },
      });
      chats += 1;

      const rows = (conversation.messages?.data ?? [])
        .filter((message) => message.id)
        .map((message) => {
          const createdAt = message.created_time ? new Date(message.created_time) : new Date();
          const direction = message.from?.id === settings.igUserId ? "out" : "in";
          const attachment = message.attachments?.[0]?.type;

          return {
            chatRefId: chat.id,
            externalId: message.id as string,
            direction,
            text:
              message.message?.trim() ||
              (attachment ? (MEDIA_LABELS[attachment] ?? "[xabar]") : "[xabar]"),
            createdAt,
            readAt: direction === "out" ? createdAt : null,
          };
        });

      if (rows.length > 0) {
        const existing = new Set(
          (
            await prisma.metaMessage.findMany({
              where: { chatRefId: chat.id, externalId: { in: rows.map((row) => row.externalId) } },
              select: { externalId: true, direction: true },
            })
          ).map((row) => `${row.externalId}:${row.direction}`),
        );

        const fresh = rows.filter((row) => !existing.has(`${row.externalId}:${row.direction}`));

        if (fresh.length > 0) {
          await prisma.metaMessage.createMany({ data: fresh });
          messages += fresh.length;
        }

        const newest = rows.reduce(
          (max, row) => (row.createdAt > max ? row.createdAt : max),
          rows[0].createdAt,
        );
        await prisma.metaChat.update({ where: { id: chat.id }, data: { lastMessageAt: newest } });
      }
    }

    next = payload.paging?.next ?? null;
    pages += 1;
  } while (false);

  // Keyingi bosish shu kursoradan davom etadi; tugagach keyingi safar boshidan
  await prisma.metaIntegration.update({
    where: { id: "default" },
    data: { historyCursor: next },
  });

  return { ok: true, result: { chats, messages, done: !next } };
}

type PageProfile = {
  id: string;
  name: string;
  instagram_business_account?: { id: string; username?: string };
};

/** Page token va IG akkauntni tekshiradi, natijani bazaga yozadi */
export async function checkMetaConnection(): Promise<
  MetaResult<{ pageName: string; igUsername: string | null }>
> {
  const settings = await getMetaSettings();
  if (!settings.pageId || !settings.pageToken) {
    return { ok: false, description: "Page ID va Page token kerak" };
  }

  const result = await metaGraph<PageProfile>(settings.pageId, {
    token: settings.pageToken,
    params: { fields: "id,name,instagram_business_account{id,username}" },
  });

  if (!result.ok) {
    return { ok: false, description: result.description, code: result.code };
  }

  const pageName = result.result.name ?? settings.pageId;
  const ig = result.result.instagram_business_account;
  const igUsername = ig?.username ? `@${ig.username}` : null;

  await prisma.metaIntegration.update({
    where: { id: "default" },
    data: {
      pageName,
      igUsername,
      igUserId: ig?.id ?? settings.igUserId,
      connectedAt: new Date(),
    },
  });

  if (ig?.id) {
    await subscribeInstagramWebhooks(ig.id, settings.pageToken);
  }

  return { ok: true, result: { pageName, igUsername } };
}

/** Instagram yoki Facebook suhbatiga rasm/video/ovoz/fayl yuborish (ochiq URL orqali) */
export async function sendMetaAttachment(
  platform: "instagram" | "facebook",
  recipientId: string,
  mediaType: "photo" | "video" | "audio" | "file",
  url: string,
): Promise<MetaResult<{ message_id?: string }>> {
  const settings = await getMetaSettings();
  const target = platform === "instagram" ? settings.igUserId : settings.pageId;

  if (!target) {
    return { ok: false, description: "Sahifa yoki Instagram ID o'rnatilmagan" };
  }

  return metaGraph<{ message_id?: string }>(`${target}/messages`, {
    method: "POST",
    token: settings.pageToken,
    body: {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: mediaType === "photo" ? "image" : mediaType,
          payload: { url },
        },
      },
    },
  });
}

/** Webhook imzosini App Secret bilan tekshiradi */
export async function verifyMetaSignature(rawBody: string, header: string | null): Promise<boolean> {
  if (!header || !header.startsWith("sha256=")) return false;

  const settings = await getMetaSettings();
  if (!settings.appSecret) return false;

  const expected = createHmac("sha256", settings.appSecret).update(rawBody, "utf8").digest("hex");
  const provided = header.slice("sha256=".length);

  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(provided).digest();
  return timingSafeEqual(a, b);
}

/** Facebook yoki Instagram orqali javob yuborish */
export async function sendMetaMessage(
  platform: "facebook" | "instagram",
  recipientId: string,
  text: string,
): Promise<MetaResult<{ message_id?: string }>> {
  const settings = await getMetaSettings();

  if (platform === "instagram") {
    if (!settings.igUserId) {
      return { ok: false, description: "Instagram akkaunt ID o'rnatilmagan" };
    }

    return metaGraph<{ message_id?: string }>(`${settings.igUserId}/messages`, {
      method: "POST",
      token: settings.pageToken,
      body: { recipient: { id: recipientId }, message: { text } },
    });
  }

  if (!settings.pageId) {
    return { ok: false, description: "Page ID o'rnatilmagan" };
  }

  return metaGraph<{ message_id?: string }>(`${settings.pageId}/messages`, {
    method: "POST",
    token: settings.pageToken,
    body: {
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text },
    },
  });
}
