import { createHash, timingSafeEqual } from "crypto";

const API_BASE = "https://api.telegram.org";

export type TelegramOk<T> = { ok: true; result: T };
export type TelegramFail = { ok: false; description: string; code?: number };
export type TelegramResponse<T> = TelegramOk<T> | TelegramFail;

export type BotInfo = {
  id: number;
  first_name: string;
  username?: string;
};

export type ChannelInfo = {
  id: number;
  title: string;
  username?: string;
  type: string;
};

export type WebhookInfo = {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
};

export type SentMessage = {
  message_id: number;
  chat: { id: number; title?: string; username?: string };
};

export type BusinessConnectionInfo = {
  id: string;
  user: { id: number; first_name?: string; last_name?: string; username?: string };
  user_chat_id: number;
  date: number;
  can_reply?: boolean;
  is_enabled: boolean;
};

/** Bot tokeni: berilsa — adminning shaxsiy boti, aks holda serverdagi (owner) boti */
function botToken(explicit?: string | null): string {
  const own = explicit?.trim();
  if (own) return own;
  return process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
}

export function telegramChannelId(): string {
  return process.env.TELEGRAM_CHANNEL_ID?.trim() ?? "";
}

export function telegramConfigured(): boolean {
  return Boolean(botToken() && telegramChannelId());
}

/**
 * Webhook manzili. Domen ishga tushmaguncha TELEGRAM_WEBHOOK_URL bilan
 * vaqtincha ishlaydigan manzilga yo'naltirish mumkin.
 */
export function telegramWebhookUrl(): string {
  const override = process.env.TELEGRAM_WEBHOOK_URL?.trim();
  if (override) return override;

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/webhooks/telegram`;
}

/**
 * Bot API chaqiruvi. Token hech qachon logga yoki xato matniga chiqmaydi.
 */
export async function telegramCall<T>(
  method: string,
  payload?: Record<string, unknown>,
  bot?: string | null,
): Promise<TelegramResponse<T>> {
  const token = botToken(bot);
  if (!token) {
    return { ok: false, description: "TELEGRAM_BOT_TOKEN o'rnatilmagan" };
  }

  try {
    const response = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: payload ? "POST" : "GET",
      headers: payload ? { "content-type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    const data = (await response.json().catch(() => null)) as
      | { ok: true; result: T }
      | { ok: false; description?: string; error_code?: number }
      | null;

    if (!data || !data.ok) {
      return {
        ok: false,
        description: data && "description" in data ? (data.description ?? "Telegram xatosi") : "Telegram javob bermadi",
        code: data && "error_code" in data ? data.error_code : undefined,
      };
    }

    return { ok: true, result: data.result };
  } catch {
    // Timeout yoki tarmoq xatosi — token bu yerda ko'rinmaydi
    return { ok: false, description: "Telegram bilan aloqa yo'q" };
  }
}

/** Multipart yuklash (rasm/video) — JSON emas, FormData bilan */
async function telegramUpload<T>(
  method: string,
  form: FormData,
  bot?: string | null,
): Promise<TelegramResponse<T>> {
  const token = botToken(bot);
  if (!token) {
    return { ok: false, description: "TELEGRAM_BOT_TOKEN o'rnatilmagan" };
  }

  try {
    const response = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(90_000),
    });

    const data = (await response.json().catch(() => null)) as
      | { ok: true; result: T }
      | { ok: false; description?: string; error_code?: number }
      | null;

    if (!data || !data.ok) {
      return {
        ok: false,
        description: data && "description" in data ? (data.description ?? "Telegram xatosi") : "Telegram javob bermadi",
        code: data && "error_code" in data ? data.error_code : undefined,
      };
    }

    return { ok: true, result: data.result };
  } catch {
    return { ok: false, description: "Telegram bilan aloqa yo'q" };
  }
}

/** Telegram serveridan faylni yuklab olish (rasm, video, hujjat) */
export async function downloadTelegramFile(
  fileId: string,
  bot?: string | null,
): Promise<{ buffer: Buffer; extension: string } | null> {
  const token = botToken(bot);
  if (!token) return null;

  const info = await telegramCall<{ file_path?: string }>("getFile", { file_id: fileId }, bot);
  if (!info.ok || !info.result.file_path) return null;

  try {
    const response = await fetch(`${API_BASE}/file/bot${token}/${info.result.file_path}`, {
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = info.result.file_path.split(".").pop()?.slice(0, 5) ?? "jpg";

    return { buffer, extension };
  } catch {
    return null;
  }
}

/** Foydalanuvchining profil rasmlari */
export function getUserProfilePhotos(userId: string, limit = 1, bot?: string | null) {
  return telegramCall<{ total_count: number; photos: { file_id: string; width: number; height: number }[][] }>(
    "getUserProfilePhotos",
    { user_id: userId, limit },
    bot,
  );
}

/** Rasm yoki videoni chatga yuborish (caption — izoh) */
export function sendTelegramMedia(
  chatId: string,
  file: File,
  caption: string,
  businessConnectionId?: string | null,
  bot?: string | null,
) {
  const isVideo = file.type.startsWith("video/");
  const form = new FormData();

  form.append("chat_id", chatId);
  form.append(isVideo ? "video" : "photo", file, file.name || (isVideo ? "video.mp4" : "photo.jpg"));
  if (caption.trim()) form.append("caption", caption.trim().slice(0, 1000));
  if (businessConnectionId) form.append("business_connection_id", businessConnectionId);
  if (isVideo) form.append("supports_streaming", "true");

  return telegramUpload<SentMessage>(isVideo ? "sendVideo" : "sendPhoto", form, bot);
}

/** Ovozli xabar yuborish — fayl OGG/OPUS formatida bo'lishi kerak */
export function sendTelegramVoice(
  chatId: string,
  file: File,
  caption: string,
  businessConnectionId?: string | null,
  bot?: string | null,
) {
  const form = new FormData();

  form.append("chat_id", chatId);
  form.append("voice", file, file.name || "voice.ogg");
  if (caption.trim()) form.append("caption", caption.trim().slice(0, 1000));
  if (businessConnectionId) form.append("business_connection_id", businessConnectionId);

  return telegramUpload<SentMessage>("sendVoice", form, bot);
}

export function getBotInfo(bot?: string | null) {
  return telegramCall<BotInfo>("getMe", undefined, bot);
}

export function getChannelInfo() {
  const channelId = telegramChannelId();
  if (!channelId) {
    return Promise.resolve<TelegramResponse<ChannelInfo>>({
      ok: false,
      description: "TELEGRAM_CHANNEL_ID o'rnatilmagan",
    });
  }

  return telegramCall<ChannelInfo>("getChat", { chat_id: channelId });
}

export function getChannelMemberCount() {
  const channelId = telegramChannelId();
  if (!channelId) {
    return Promise.resolve<TelegramResponse<number>>({
      ok: false,
      description: "TELEGRAM_CHANNEL_ID o'rnatilmagan",
    });
  }

  return telegramCall<number>("getChatMemberCount", { chat_id: channelId });
}

export function getWebhookInfo(bot?: string | null) {
  return telegramCall<WebhookInfo>("getWebhookInfo", undefined, bot);
}

export function sendTelegramMessage(
  chatId: string,
  text: string,
  businessConnectionId?: string | null,
  bot?: string | null,
) {
  return telegramCall<SentMessage>(
    "sendMessage",
    {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      business_connection_id: businessConnectionId || undefined,
    },
    bot,
  );
}

/** Business ulanish holatini Telegram'dan so'rash */
export function getBusinessConnection(businessConnectionId: string, bot?: string | null) {
  return telegramCall<BusinessConnectionInfo>(
    "getBusinessConnection",
    { business_connection_id: businessConnectionId },
    bot,
  );
}

export function sendChannelPost(text: string) {
  const channelId = telegramChannelId();
  if (!channelId) {
    return Promise.resolve<TelegramResponse<SentMessage>>({
      ok: false,
      description: "TELEGRAM_CHANNEL_ID o'rnatilmagan",
    });
  }

  return telegramCall<SentMessage>("sendMessage", {
    chat_id: channelId,
    text,
    disable_web_page_preview: false,
  });
}

export function setTelegramWebhook(
  url: string,
  options: { bot?: string | null; secret?: string | null } = {},
) {
  const secret = options.secret !== undefined
    ? (options.secret ?? "")
    : (process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "");
  return telegramCall<boolean>(
    "setWebhook",
    {
      url,
      secret_token: secret || undefined,
      allowed_updates: [
        "message",
        "edited_message",
        "callback_query",
        "business_connection",
        "business_message",
        "edited_business_message",
      ],
      drop_pending_updates: false,
    },
    options.bot,
  );
}

export function deleteTelegramWebhook(bot?: string | null) {
  return telegramCall<boolean>("deleteWebhook", { drop_pending_updates: false }, bot);
}

export function telegramErrorCode(description: string): "nochat" | "norights" | "error" {
  const text = description.toLowerCase();

  if (text.includes("chat not found") || text.includes("bad request: chat")) {
    return "nochat";
  }
  if (text.includes("right") || text.includes("forbidden") || text.includes("not enough")) {
    return "norights";
  }
  return "error";
}

/** Telegram webhook sarlavhasini vaqt-ga chidamli usulda tekshiradi */
export function verifyTelegramSecret(header: string | null): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret || !header) return false;

  const a = createHash("sha256").update(header).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}
