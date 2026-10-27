import { NextResponse } from "next/server";
import { notifyAdmins } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { ensureAvatar } from "@/lib/telegram-avatar";
import { notificationIcon } from "@/lib/push-image";
import {
  adminForTelegramUser,
  botForWebhookSecret,
  linkTelegramAccount,
} from "@/lib/telegram-account";
import {
  downloadTelegramFile,
  getBusinessConnection,
  sendTelegramMessage,
} from "@/lib/telegram";
import { saveMediaBuffer } from "@/lib/uploads";

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

type TelegramMessagePayload = {
  message_id: number;
  date: number;
  business_connection_id?: string;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
  caption?: string;
  photo?: { file_id: string; width: number; height: number }[];
  document?: { file_id: string; mime_type?: string; file_name?: string };
  video?: { file_id: string; mime_type?: string; file_name?: string };
  animation?: { file_id: string; mime_type?: string };
  voice?: { file_id: string; mime_type?: string; duration?: number };
  audio?: { file_id: string; mime_type?: string; file_name?: string; duration?: number };
  video_note?: { file_id: string; mime_type?: string; duration?: number };
  sticker?: unknown;
  location?: unknown;
};

type BusinessConnectionPayload = {
  id: string;
  user: TelegramUser;
  user_chat_id: number;
  date: number;
  can_reply?: boolean;
  is_enabled: boolean;
};

type BusinessMessagePayload = TelegramMessagePayload & {
  business_connection_id?: string;
  /** Eski/alternativ format uchun */
  message?: TelegramMessagePayload;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessagePayload;
  edited_message?: TelegramMessagePayload;
  channel_post?: TelegramMessagePayload;
  business_connection?: BusinessConnectionPayload;
  business_message?: BusinessMessagePayload;
  edited_business_message?: BusinessMessagePayload;
};

function senderName(user: TelegramUser | undefined, chat: TelegramChat): string {
  if (user) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    if (name) return name;
    if (user.username) return `@${user.username}`;
  }

  return chat.title || chat.first_name || chat.username || String(chat.id);
}

function chatTitle(chat: TelegramChat): string {
  return chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" ") || String(chat.id);
}

function messageText(message: TelegramMessagePayload): string {
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

/** Business ulanishni saqlash (bot shaxsiy akkauntga ulanganda keladi) */
async function saveBusinessConnection(
  connection: BusinessConnectionPayload,
  botAdminId: string | null,
): Promise<void> {
  const name = [connection.user.first_name, connection.user.last_name].filter(Boolean).join(" ").trim();
  const ownerId = String(connection.user.id);

  // Akkaunt egasi panelda Telegramini ulagan bo'lsa — suhbatlar shu adminga tegishli,
  // aks holda bot kimniki bo'lsa — o'shaniki
  const admin = (await adminForTelegramUser(ownerId)) ?? (botAdminId ? { id: botAdminId } : null);

  await prisma.telegramBusiness.upsert({
    where: { id: connection.id },
    create: {
      id: connection.id,
      ownerId,
      ownerName: name || connection.user.username || null,
      username: connection.user.username ?? null,
      adminUserId: admin?.id ?? null,
      canReply: connection.can_reply ?? true,
      isEnabled: connection.is_enabled,
    },
    update: {
      ownerId,
      ownerName: name || connection.user.username || null,
      username: connection.user.username ?? null,
      ...(admin ? { adminUserId: admin.id } : {}),
      canReply: connection.can_reply ?? true,
      isEnabled: connection.is_enabled,
    },
  });

  if (admin) {
    await prisma.telegramChat.updateMany({
      where: { businessConnectionId: connection.id },
      data: { adminUserId: admin.id },
    });
  }
}

/** Business ulanishni topadi; webhookdan oldin kelmagan bo'lsa Telegram'dan so'raydi */
async function businessConnection(
  connectionId: string,
  bot: string | null,
  botAdminId: string | null,
) {
  const stored = await prisma.telegramBusiness.findUnique({ where: { id: connectionId } });
  if (stored) return stored;

  const remote = await getBusinessConnection(connectionId, bot);
  if (!remote.ok) return null;

  await saveBusinessConnection(remote.result, botAdminId);
  return prisma.telegramBusiness.findUnique({ where: { id: connectionId } });
}


/** Kelgan rasm/video/hujjatni yuklab, lokal saqlash */
async function downloadMedia(
  message: TelegramMessagePayload,
  bot: string | null,
): Promise<{ type: string; path: string } | null> {
  let fileId: string | undefined;
  let type = "photo";

  if (message.photo && message.photo.length > 0) {
    fileId = message.photo[message.photo.length - 1]?.file_id;
    type = "photo";
  } else if (message.voice) {
    fileId = message.voice.file_id;
    type = "audio";
  } else if (message.audio) {
    fileId = message.audio.file_id;
    type = "audio";
  } else if (message.video) {
    fileId = message.video.file_id;
    type = "video";
  } else if (message.video_note) {
    fileId = message.video_note.file_id;
    type = "video";
  } else if (message.animation) {
    fileId = message.animation.file_id;
    type = "video";
  } else if (message.document) {
    const mime = message.document.mime_type ?? "";
    if (mime.startsWith("image/")) type = "photo";
    else if (mime.startsWith("video/")) type = "video";
    else if (mime.startsWith("audio/")) type = "audio";
    else return null;
    fileId = message.document.file_id;
  }

  if (!fileId) return null;

  try {
    const file = await downloadTelegramFile(fileId, bot);
    if (!file) return null;

    const saved = await saveMediaBuffer(file.buffer, file.extension);
    return { type, path: saved.url };
  } catch {
    return null;
  }
}


async function storeMessage(options: {
  message: TelegramMessagePayload;
  businessConnectionId?: string;
  businessOwnerId?: string;
  adminUserId?: string | null;
  bot?: string | null;
}): Promise<void> {
  const { message, businessConnectionId, businessOwnerId, adminUserId, bot } = options;
  const chat = message.chat;

  if (chat.type === "channel") return;

  const title = chatTitle(chat);

  const storedChat = await prisma.telegramChat.upsert({
    where: { chatId: String(chat.id) },
    create: {
      chatId: String(chat.id),
      title,
      username: chat.username ?? message.from?.username ?? null,
      type: chat.type,
      businessConnectionId: businessConnectionId ?? null,
      businessOwnerId: businessOwnerId ?? null,
      adminUserId: adminUserId ?? null,
      lastMessageAt: new Date(message.date * 1000),
    },
    update: {
      title,
      username: chat.username ?? message.from?.username ?? undefined,
      type: chat.type,
      businessConnectionId: businessConnectionId ?? undefined,
      businessOwnerId: businessOwnerId ?? undefined,
      adminUserId: adminUserId ?? undefined,
      lastMessageAt: new Date(message.date * 1000),
    },
  });

  await ensureAvatar(storedChat, undefined, bot ?? null);

  const isOwner = Boolean(businessOwnerId && String(message.from?.id ?? "") === businessOwnerId);
  const direction = isOwner ? "out" : "in";
  const media = await downloadMedia(message, bot ?? null);

  const stored = await prisma.telegramMessage.create({
    data: {
      chatRefId: storedChat.id,
      tgMessageId: message.message_id,
      direction,
      text: message.caption ?? message.text ?? (media ? "" : messageText(message)),
      fromName: isOwner ? "Shaxsiy akkaunt" : senderName(message.from, chat),
      mediaType: media?.type ?? null,
      mediaPath: media?.path ?? null,
      createdAt: new Date(message.date * 1000),
      readAt: isOwner ? new Date(message.date * 1000) : null,
    },
  });

  // Mijoz javob yozdi — demak oldingi chiquvchi xabarlarni o'qigan: 2 prichka
  if (!isOwner) {
    await prisma.telegramMessage.updateMany({
      where: { chatRefId: storedChat.id, direction: "out", readAt: null },
      data: { readAt: new Date(message.date * 1000) },
    });
  }

  // Akkaunt egasi o'zi yozgan xabar uchun bildirishnoma yubormaymiz
  if (isOwner) return;

  const freshAvatar = await prisma.telegramChat
    .findUnique({ where: { id: storedChat.id }, select: { avatarPath: true } })
    .catch(() => null);

  const icon = await notificationIcon({
    avatarPath: freshAvatar?.avatarPath ?? storedChat.avatarPath,
    platform: "telegram",
  });

  await notifyAdmins({
    kind: "telegram",
    title: `Telegram · ${storedChat.title}`,
    body: stored.text || (media?.type === "audio" ? "[ovozli xabar]" : stored.text),
    href: `/admin/meta/xabarlar?chat=${storedChat.id}`,
    icon,
    adminUserId: adminUserId ?? storedChat.adminUserId ?? null,
  });
}

export async function POST(request: Request) {
  // Har bir botning o'z siri bor: owner boti yoki adminning shaxsiy boti
  const bot = await botForWebhookSecret(
    request.headers.get("x-telegram-bot-api-secret-token"),
  );
  if (!bot) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const kinds = Object.keys(update).filter((key) => key !== "update_id");
    console.log("[tg-webhook]", update.update_id, kinds.join(",") || "empty");

    if (update.business_connection) {
      console.log(
        "[tg-business-connection]",
        update.business_connection.id,
        update.business_connection.user.id,
        update.business_connection.is_enabled,
        update.business_connection.can_reply,
      );
      await saveBusinessConnection(update.business_connection, bot.adminUserId);
      return NextResponse.json({ ok: true });
    }

    const business = update.business_message ?? update.edited_business_message;
    if (business) {
      // Bot API'da business_message — Message obyektining o'zi (business_connection_id bilan)
      const message = business.message ?? business;
      const connectionId = business.business_connection_id ?? message.business_connection_id;

      if (!connectionId) return NextResponse.json({ ok: true });

      // Bot o'z xabarlarini qayta yozib yubormasin
      if (message.from?.is_bot) return NextResponse.json({ ok: true });

      const connection = await businessConnection(connectionId, bot.token, bot.adminUserId);
      if (!connection) {
        console.log("[tg-business] connection topilmadi", connectionId);
        return NextResponse.json({ ok: true });
      }

      console.log(
        "[tg-business-message]",
        connection.id,
        message.chat.id,
        message.from?.id,
        connection.ownerId,
      );

      const adminUserId =
        connection.adminUserId ??
        (await adminForTelegramUser(connection.ownerId))?.id ??
        bot.adminUserId;

      await storeMessage({
        message,
        businessConnectionId: connection.id,
        businessOwnerId: connection.ownerId,
        adminUserId,
        bot: bot.token,
      });

      return NextResponse.json({ ok: true });
    }

    const message = update.message ?? update.edited_message ?? update.channel_post;
    if (!message) return NextResponse.json({ ok: true });

    // Bot o'z xabarlarini qayta yozib yubormasin
    if (message.from?.is_bot) return NextResponse.json({ ok: true });

    // Profil → Telegram: botga «/start <token>» bilan kelgan ulanish so'rovi
    const start = /^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{6,64})\s*$/.exec((message.text ?? "").trim());
    if (start && message.chat.type === "private" && message.from) {
      const linked = await linkTelegramAccount({
        token: start[1],
        telegramUserId: String(message.from.id),
        username: message.from.username ?? null,
      });

      await sendTelegramMessage(
        String(message.chat.id),
        linked.ok
          ? `✅ Telegram ulandi${linked.name ? `: ${linked.name}` : ""}. Endi mijoz xabarlari faqat shu hisobning panelida ko'rinadi.`
          : "❌ Havola eskirgan. Panelda Profil → Telegram bo'limidan yangi havola oling.",
        null,
        bot.token,
      );

      return NextResponse.json({ ok: true });
    }

    // Botga to'g'ridan-to'g'ri yozganlar — bot kimniki bo'lsa, o'sha adminning suhbatlari
    await storeMessage({ message, adminUserId: bot.adminUserId, bot: bot.token });
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
