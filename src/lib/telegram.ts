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

function botToken(): string {
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
): Promise<TelegramResponse<T>> {
  const token = botToken();
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

export function getBotInfo() {
  return telegramCall<BotInfo>("getMe");
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

export function getWebhookInfo() {
  return telegramCall<WebhookInfo>("getWebhookInfo");
}

export function sendTelegramMessage(chatId: string, text: string) {
  return telegramCall<SentMessage>("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
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

export function setTelegramWebhook(url: string) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
  return telegramCall<boolean>("setWebhook", {
    url,
    secret_token: secret || undefined,
    allowed_updates: ["message", "edited_message", "callback_query"],
    drop_pending_updates: false,
  });
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
