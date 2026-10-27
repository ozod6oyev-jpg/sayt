import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "./prisma";
import { downloadTelegramFile, getUserProfilePhotos } from "./telegram";
import { botTokenForAdmin } from "./telegram-account";
import { saveMediaBuffer, uploadsRoot } from "./uploads";

/** Ochilgan chatda profil rasmi shu vaqt ichida qayta tekshirilmaydi */
const MAX_AGE_MS = 60 * 1000;

export type AvatarChat = {
  id: string;
  chatId: string;
  avatarPath: string | null;
  avatarCheckedAt: Date | null;
};

function hashOf(buffer: Buffer): string {
  return createHash("sha1").update(buffer).digest("hex");
}

/**
 * Telegram profil rasmini yangilaydi. Rasm o'zgargan bo'lsa yangi fayl saqlanadi,
 * o'zgarmagan bo'lsa faqat tekshirilgan vaqt yoziladi (disk behuda to'lmaydi).
 */
export async function ensureAvatar(
  chat: AvatarChat,
  maxAgeMs = MAX_AGE_MS,
  bot?: string | null,
): Promise<boolean> {
  const fresh =
    chat.avatarCheckedAt !== null && Date.now() - chat.avatarCheckedAt.getTime() < maxAgeMs;

  if (fresh) return false;

  try {
    const photos = await getUserProfilePhotos(chat.chatId, 1, bot);
    const sizes = photos.ok ? photos.result.photos[0] : undefined;

    if (!sizes || sizes.length === 0) {
      await prisma.telegramChat.update({
        where: { id: chat.id },
        data: { avatarCheckedAt: new Date(), avatarPath: null },
      });
      return Boolean(chat.avatarPath);
    }

    const best = sizes.find((size) => size.width >= 160) ?? sizes[sizes.length - 1];
    const file = await downloadTelegramFile(best.file_id, bot);

    if (!file) {
      await prisma.telegramChat.update({
        where: { id: chat.id },
        data: { avatarCheckedAt: new Date() },
      });
      return false;
    }

    if (chat.avatarPath) {
      const previous = await readFile(
        path.join(uploadsRoot(), path.basename(chat.avatarPath)),
      ).catch(() => null);

      if (previous && hashOf(previous) === hashOf(file.buffer)) {
        await prisma.telegramChat.update({
          where: { id: chat.id },
          data: { avatarCheckedAt: new Date() },
        });
        return false;
      }
    }

    const saved = await saveMediaBuffer(file.buffer, file.extension);

    await prisma.telegramChat.update({
      where: { id: chat.id },
      data: { avatarPath: saved.url, avatarCheckedAt: new Date() },
    });

    return true;
  } catch {
    // Telegram javob bermasa — chat ochilishiga xalal bermaymiz
    return false;
  }
}

/** Chat ochilganda chaqiriladi: profil rasmi o'zgargan bo'lsa darhol yangilanadi */
export async function refreshChatAvatar(chatId: string): Promise<boolean> {
  const chat = await prisma.telegramChat.findUnique({
    where: { id: chatId },
    select: {
      id: true,
      chatId: true,
      avatarPath: true,
      avatarCheckedAt: true,
      adminUserId: true,
    },
  });

  if (!chat) return false;

  const bot = await botTokenForAdmin(chat.adminUserId);

  return ensureAvatar(chat, undefined, bot);
}
