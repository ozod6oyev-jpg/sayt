import { prisma } from "./prisma";
import { isAudioMime, toVoiceOgg } from "./audio";
import { fullDate, listTime } from "./datetime";
import { sendTelegramMedia, sendTelegramMessage, sendTelegramVoice } from "./telegram";
import { botTokenForAdmin } from "./telegram-account";
import { metaBaseUrl, sendMetaAttachment, sendMetaMessage } from "./meta";
import { publishThreadsReply } from "./threads";
import { extensionFromMime, saveMediaBuffer } from "./uploads";
import type { InboxChatItem, InboxKind, InboxMessage, InboxThreadData } from "./inbox-types";

export type InboxLabels = {
  you: string;
  businessBadge: string;
  mediaPhoto: string;
  mediaVideo: string;
  mediaVoice: string;
  noMessageYet: string;
  metaInstagram: string;
  metaFacebook: string;
  filterTelegram: string;
  filterThreads: string;
};

export { listTime, fullDate };

/** Panelda ko'rayotgan admin
 *  Telegram — har bir admin uchun alohida, Facebook/Instagram — umumiy. */
export type InboxViewer = { id: string; role: string };

/** Telegram suhbatlari: faqat o'ziniki; owner uchun egasiz eski suhbatlar ham */
function telegramWhere(viewer: InboxViewer) {
  return viewer.role === "owner"
    ? { OR: [{ adminUserId: viewer.id }, { adminUserId: null }] }
    : { adminUserId: viewer.id };
}

/** Suhbatni shu admin ko'ra oladimi */
function canSeeTelegramChat(
  chat: { adminUserId: string | null },
  viewer: InboxViewer,
): boolean {
  if (chat.adminUserId === viewer.id) return true;
  return viewer.role === "owner" && chat.adminUserId === null;
}

/** Telegram va Meta suhbatlarini bitta ro'yxatga yig'adi */
export async function listChats(
  filter: "all" | "telegram" | "facebook" | "instagram" | "threads",
  labels: InboxLabels,
  viewer: InboxViewer,
): Promise<InboxChatItem[]> {
  const [telegramChats, metaChats] = await Promise.all([
    filter === "all" || filter === "telegram"
      ? prisma.telegramChat.findMany({
          where: telegramWhere(viewer),
          orderBy: { lastMessageAt: "desc" },
          take: 200,
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
            _count: { select: { messages: { where: { direction: "in", readAt: null } } } },
          },
        })
      : Promise.resolve([]),
    filter !== "telegram"
      ? prisma.metaChat.findMany({
          where:
            filter === "facebook" || filter === "instagram" || filter === "threads"
              ? { platform: filter }
              : {},
          orderBy: { lastMessageAt: "desc" },
          take: 200,
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
            _count: { select: { messages: { where: { direction: "in", readAt: null } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  const items: InboxChatItem[] = [
    ...telegramChats.map((chat) => ({
      key: `telegram-${chat.id}`,
      id: chat.id,
      kind: "telegram" as const,
      title: chat.title,
      subtitle: `${chat.username ? `@${chat.username}` : chat.type}${
        chat.businessConnectionId ? ` · ${labels.businessBadge}` : ""
      }`,
      time: listTime(chat.lastMessageAt),
      ts: chat.lastMessageAt.getTime(),
      unread: chat._count.messages,
      lastText:
        chat.messages[0]?.text ||
        (chat.messages[0]?.mediaType === "video"
          ? `[${labels.mediaVideo}]`
          : chat.messages[0]?.mediaType === "audio"
            ? `[${labels.mediaVoice}]`
            : chat.messages[0]?.mediaType
              ? `[${labels.mediaPhoto}]`
              : labels.noMessageYet),
      lastOut: chat.messages[0]?.direction === "out",
      platform: labels.filterTelegram,
      avatar: chat.avatarPath,
    })),
    ...metaChats.map((chat) => ({
      key: `meta-${chat.id}`,
      id: chat.id,
      kind: "meta" as const,
      title: chat.name,
      subtitle:
        chat.platform === "threads"
          ? labels.filterThreads
          : chat.platform === "instagram"
            ? labels.metaInstagram
            : labels.metaFacebook,
      time: listTime(chat.lastMessageAt),
      ts: chat.lastMessageAt.getTime(),
      unread: chat._count.messages,
      lastText:
        chat.messages[0]?.text ||
        (chat.messages[0]?.mediaType === "audio" ? `[${labels.mediaVoice}]` : labels.noMessageYet),
      lastOut: chat.messages[0]?.direction === "out",
      platform:
        chat.platform === "threads"
          ? labels.filterThreads
          : chat.platform === "instagram"
            ? labels.metaInstagram
            : labels.metaFacebook,
      avatar: chat.avatarPath,
    })),
  ];

  return items.sort((a, b) => b.ts - a.ts);
}

function toDto(message: {
  id: string;
  direction: string;
  text: string;
  createdAt: Date;
  mediaType?: string | null;
  mediaPath?: string | null;
  readAt: Date | null;
}): InboxMessage {
  return {
    id: message.id,
    direction: message.direction,
    text: message.text,
    author: "",
    createdAt: message.createdAt.toISOString(),
    mediaType: message.mediaType ?? null,
    mediaPath: message.mediaPath ?? null,
    readAt: message.readAt ? message.readAt.toISOString() : null,
  };
}

/** Suhbatni (xabarlari bilan) yuklaydi */
export async function loadThread(
  chatId: string,
  labels: InboxLabels,
  viewer: InboxViewer,
): Promise<InboxThreadData | null> {
  const telegramChat = await prisma.telegramChat.findUnique({
    where: { id: chatId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  // Boshqa adminning Telegram suhbati ochilmaydi
  if (telegramChat && !canSeeTelegramChat(telegramChat, viewer)) return null;

  if (telegramChat) {
    return {
      kind: "telegram",
      platform: "telegram",
      id: telegramChat.id,
      title: telegramChat.title,
      subtitle: `${telegramChat.username ? `@${telegramChat.username}` : telegramChat.type}${
        telegramChat.businessConnectionId ? ` · ${labels.businessBadge}` : ""
      }`,
      avatar: telegramChat.avatarPath,
      handle: telegramChat.username ? `@${telegramChat.username}` : null,
      externalId: telegramChat.chatId,
      business: Boolean(telegramChat.businessConnectionId),
      messages: telegramChat.messages.map(toDto),
    };
  }

  const metaChat = await prisma.metaChat.findUnique({
    where: { id: chatId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (metaChat) {
    return {
      kind: "meta",
      platform:
        metaChat.platform === "threads"
          ? "threads"
          : metaChat.platform === "instagram"
            ? "instagram"
            : "facebook",
      id: metaChat.id,
      title: metaChat.name,
      subtitle:
        metaChat.platform === "threads"
          ? labels.filterThreads
          : metaChat.platform === "instagram"
            ? labels.metaInstagram
            : labels.metaFacebook,
      avatar: metaChat.avatarPath,
      handle: metaChat.username ? `@${metaChat.username}` : null,
      externalId: metaChat.externalId,
      business: false,
      messages: metaChat.messages.map(toDto),
    };
  }

  return null;
}

/** Suhbatdagi kelgan xabarlarni o'qilgan deb belgilaydi (ifoda ichida qayta yozilmaydi) */
export async function markThreadRead(
  kind: InboxKind,
  chatId: string,
  options: { all?: boolean; viewer?: InboxViewer } = {},
): Promise<number> {
  const now = new Date();
  const viewer = options.viewer;

  if (options.all) {
    const [telegram, meta, notifications] = await Promise.all([
      prisma.telegramMessage.updateMany({
        where: {
          direction: "in",
          readAt: null,
          ...(viewer
            ? {
                chat: viewer.role === "owner"
                  ? { OR: [{ adminUserId: viewer.id }, { adminUserId: null }] }
                  : { adminUserId: viewer.id },
              }
            : {}),
        },
        data: { readAt: now },
      }),
      prisma.metaMessage.updateMany({
        where: { direction: "in", readAt: null },
        data: { readAt: now },
      }),
      prisma.adminNotification.updateMany({
        where: {
          readAt: null,
          ...(viewer ? { OR: [{ adminUserId: null }, { adminUserId: viewer.id }] } : {}),
        },
        data: { readAt: now },
      }),
    ]);

    return telegram.count + meta.count + notifications.count;
  }

  const isTelegram = kind === "telegram";

  if (isTelegram) {
    const chat = viewer
      ? await prisma.telegramChat.findUnique({ where: { id: chatId }, select: { adminUserId: true } })
      : null;
    if (viewer && (!chat || !canSeeTelegramChat(chat, viewer))) return 0;

    const result = await prisma.telegramMessage.updateMany({
      where: { chatRefId: chatId, direction: "in", readAt: null },
      data: { readAt: now },
    });

    await prisma.adminNotification.updateMany({
      where: {
        kind: "telegram",
        readAt: null,
        ...(viewer ? { OR: [{ adminUserId: null }, { adminUserId: viewer.id }] } : {}),
      },
      data: { readAt: now },
    });

    return result.count;
  }

  const result = await prisma.metaMessage.updateMany({
    where: { chatRefId: chatId, direction: "in", readAt: null },
    data: { readAt: now },
  });

  await prisma.adminNotification.updateMany({
    where: {
      kind: "meta",
      readAt: null,
      ...(viewer ? { OR: [{ adminUserId: null }, { adminUserId: viewer.id }] } : {}),
    },
    data: { readAt: now },
  });

  return result.count;
}

export type SendReplyResult =
  | { ok: true; message: InboxMessage }
  | { ok: false; error: "invalid" | "error"; description?: string };

/** Panel orqali javob yuborish: avval tashqi tarmoqqa, keyin bazaga */
export async function sendReply(input: {
  kind: InboxKind;
  chatId: string;
  text: string;
  file: File | null;
  viewer?: InboxViewer;
}): Promise<SendReplyResult> {
  const body = input.text.trim();

  if (input.kind === "meta") {
    const file = input.file;
    const isVideo = Boolean(file?.type.startsWith("video/"));
    const isImage = Boolean(file?.type.startsWith("image/"));
    const isAudio = Boolean(file?.type && isAudioMime(file.type));
    const mediaType = file ? (isVideo ? "video" : isAudio ? "audio" : "photo") : null;

    if (body.length > 2000) return { ok: false, error: "invalid" };
    if (file && ((!isVideo && !isImage && !isAudio) || file.size > 25 * 1024 * 1024)) {
      return { ok: false, error: "invalid" };
    }
    if (!input.chatId || (!file && body.length < 1)) {
      return { ok: false, error: "invalid" };
    }

    const chat = await prisma.metaChat.findUnique({ where: { id: input.chatId } });
    if (!chat) return { ok: false, error: "invalid" };

    // Threads'da DM yo'q — javob oxirgi izoh/mention ostiga yoziladi
    if (chat.platform === "threads") {
      if (file) return { ok: false, error: "invalid" };
      if (body.length > 500) return { ok: false, error: "invalid" };

      const target = await prisma.metaMessage.findFirst({
        where: { chatRefId: chat.id, direction: "in", externalId: { not: null } },
        orderBy: { createdAt: "desc" },
      });

      if (!target?.externalId) return { ok: false, error: "invalid" };

      const reply = await publishThreadsReply(body, target.externalId);
      if (!reply.ok) return { ok: false, error: "error", description: reply.description };

      const created = await prisma.metaMessage.create({
        data: {
          chatRefId: chat.id,
          externalId: reply.result.id,
          direction: "out",
          text: body,
        },
      });

      await prisma.metaChat.update({ where: { id: chat.id }, data: { lastMessageAt: new Date() } });

      return { ok: true, message: toDto(created) };
    }

    const platform = chat.platform === "instagram" ? "instagram" : "facebook";
    let last = null as Awaited<ReturnType<typeof prisma.metaMessage.create>> | null;

    if (file && mediaType) {
      const saved = await saveMediaBuffer(
        Buffer.from(await file.arrayBuffer()),
        extensionFromMime(file.type),
      );

      const attachment = await sendMetaAttachment(
        platform,
        chat.externalId,
        mediaType as "photo" | "video" | "audio",
        `${metaBaseUrl()}${saved.url}`,
      );

      if (!attachment.ok) {
        return { ok: false, error: "error", description: attachment.description };
      }

      last = await prisma.metaMessage.create({
        data: {
          chatRefId: chat.id,
          externalId: attachment.result.message_id ?? null,
          direction: "out",
          text: body,
          mediaType,
          mediaPath: saved.url,
        },
      });
    }

    if (body.length > 0) {
      const result = await sendMetaMessage(platform, chat.externalId, body);
      if (!result.ok) return { ok: false, error: "error", description: result.description };

      last = await prisma.metaMessage.create({
        data: {
          chatRefId: chat.id,
          externalId: result.result.message_id ?? null,
          direction: "out",
          text: body,
        },
      });
    }

    if (!last) return { ok: false, error: "invalid" };

    await prisma.metaChat.update({ where: { id: chat.id }, data: { lastMessageAt: new Date() } });

    return { ok: true, message: toDto(last) };
  }

  const file = input.file;
  const isVideo = Boolean(file?.type.startsWith("video/"));
  const isImage = Boolean(file?.type.startsWith("image/"));
  const isAudio = Boolean(file?.type && isAudioMime(file.type));

  if (file) {
    const limit = isVideo
      ? 50 * 1024 * 1024
      : isAudio
        ? 20 * 1024 * 1024
        : 10 * 1024 * 1024;
    if ((!isVideo && !isImage && !isAudio) || file.size > limit || body.length > 1024) {
      return { ok: false, error: "invalid" };
    }
  }

  if (!input.chatId || (!file && (body.length < 1 || body.length > 4000))) {
    return { ok: false, error: "invalid" };
  }

  const chat = await prisma.telegramChat.findUnique({ where: { id: input.chatId } });
  if (!chat) return { ok: false, error: "invalid" };
  if (input.viewer && !canSeeTelegramChat(chat, input.viewer)) {
    return { ok: false, error: "invalid" };
  }

  // Javob suhbat qaysi botga kelgan bo'lsa, o'sha bot orqali ketadi
  const bot = await botTokenForAdmin(chat.adminUserId);

  let localMedia: string | null = null;
  let mediaType: string | null = null;
  let result;

  if (file && isAudio) {
    // Telegram voice izohi OGG/OPUS bo'lishi shart — brauzer yozgan faylni o'giramiz
    const ogg = await toVoiceOgg(Buffer.from(await file.arrayBuffer()), extensionFromMime(file.type));
    if (!ogg) return { ok: false, error: "error", description: "Ovozni o'girib bo'lmadi" };

    const saved = await saveMediaBuffer(ogg, "ogg");
    localMedia = saved.url;
    mediaType = "audio";

    const voice = new File([new Uint8Array(ogg)], "voice.ogg", { type: "audio/ogg" });
    result = await sendTelegramVoice(chat.chatId, voice, body, chat.businessConnectionId, bot);
  } else if (file) {
    const saved = await saveMediaBuffer(
      Buffer.from(await file.arrayBuffer()),
      extensionFromMime(file.type),
    );
    localMedia = saved.url;
    mediaType = isVideo ? "video" : "photo";
    result = await sendTelegramMedia(chat.chatId, file, body, chat.businessConnectionId, bot);
  } else {
    result = await sendTelegramMessage(chat.chatId, body, chat.businessConnectionId, bot);
  }

  if (!result.ok) return { ok: false, error: "error", description: result.description };

  const created = await prisma.telegramMessage.create({
    data: {
      chatRefId: chat.id,
      tgMessageId: result.result.message_id,
      direction: "out",
      text: body,
      fromName: "Panel",
      mediaType,
      mediaPath: localMedia,
    },
  });

  await prisma.telegramChat.update({ where: { id: chat.id }, data: { lastMessageAt: new Date() } });

  return { ok: true, message: toDto(created) };
}
