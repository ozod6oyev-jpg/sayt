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

  return { ok: true, result: { pageName, igUsername } };
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
