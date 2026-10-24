import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramSecret } from "@/lib/telegram";

export const dynamic = "force-dynamic";

type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramChat = {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    chat: TelegramChat;
    from?: TelegramUser;
    text?: string;
    caption?: string;
    photo?: unknown[];
    document?: { file_name?: string };
    video?: unknown;
    voice?: unknown;
    sticker?: unknown;
    location?: unknown;
  };
  edited_message?: TelegramUpdate["message"];
  channel_post?: TelegramUpdate["message"];
};

function senderName(user: TelegramUser | undefined, chat: TelegramChat): string {
  if (user) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    if (name) return name;
    if (user.username) return `@${user.username}`;
  }

  return chat.title || chat.first_name || chat.username || String(chat.id);
}

function messageText(message: NonNullable<TelegramUpdate["message"]>): string {
  if (message.text) return message.text;
  if (message.caption) return message.caption;
  if (message.photo) return "[rasm]";
  if (message.video) return "[video]";
  if (message.voice) return "[ovozli xabar]";
  if (message.document) return `[fayl: ${message.document.file_name ?? "hujjat"}]`;
  if (message.sticker) return "[stiker]";
  if (message.location) return "[joylashuv]";
  return "[xabar]";
}

export async function POST(request: Request) {
  if (!verifyTelegramSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message ?? update.edited_message ?? update.channel_post;
  if (!message) {
    return NextResponse.json({ ok: true });
  }

  // Bot o'z xabarlarini qayta yozib yubormasin
  if (message.from?.is_bot) {
    return NextResponse.json({ ok: true });
  }

  const chat = message.chat;
  if (chat.type === "channel") {
    return NextResponse.json({ ok: true });
  }

  const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" ") || String(chat.id);

  try {
    const storedChat = await prisma.telegramChat.upsert({
      where: { chatId: String(chat.id) },
      create: {
        chatId: String(chat.id),
        title,
        username: chat.username ?? message.from?.username ?? null,
        type: chat.type,
        lastMessageAt: new Date(message.date * 1000),
      },
      update: {
        title,
        username: chat.username ?? message.from?.username ?? undefined,
        type: chat.type,
        lastMessageAt: new Date(message.date * 1000),
      },
    });

    await prisma.telegramMessage.create({
      data: {
        chatRefId: storedChat.id,
        tgMessageId: message.message_id,
        direction: "in",
        text: messageText(message),
        fromName: senderName(message.from, chat),
        createdAt: new Date(message.date * 1000),
      },
    });
  } catch (error) {
    // Takroriy update (masalan qayta yuborilgan) — xato emas
    if ((error as { code?: string }).code !== "P2002") {
      console.error("Telegram webhook xatosi:", (error as Error).message);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
