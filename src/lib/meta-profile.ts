import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { getMetaSettings } from "./meta";
import { fetchProfile, type MetaProfile } from "./meta-profile-fetch";
import { prisma } from "./prisma";
import { extensionFromMime, saveMediaBuffer, uploadsRoot } from "./uploads";

/** Profil (ism, username, rasm) shu vaqt ichida qayta so'ralmaydi */
const PROFILE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const AVATAR_LIMIT = 4 * 1024 * 1024;

function hashOf(buffer: Buffer): string {
  return createHash("sha1").update(buffer).digest("hex");
}

/** Profil rasmini yuklab saqlaydi; rasm o'zgargan bo'lsa yangi fayl yoziladi */
async function downloadAvatar(
  url: string,
  previousPath: string | null,
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > AVATAR_LIMIT) return null;

    if (previousPath) {
      const previous = await readFile(
        path.join(uploadsRoot(), path.basename(previousPath)),
      ).catch(() => null);
      if (previous && hashOf(previous) === hashOf(buffer)) return null;
    }

    const mime = response.headers.get("content-type") ?? "image/jpeg";
    const saved = await saveMediaBuffer(buffer, extensionFromMime(mime));
    return saved.url;
  } catch {
    return null;
  }
}

/**
 * Chat nomi, username va profil rasmini Meta'dan yangilaydi.
 * Webhook'da birinchi xabar kelganda va chat ochilganda chaqiriladi.
 */
export async function syncMetaChatProfile(
  chatId: string,
  maxAgeMs = PROFILE_MAX_AGE_MS,
): Promise<boolean> {
  const chat = await prisma.metaChat.findUnique({ where: { id: chatId } });
  if (!chat || chat.platform === "threads") return false;

  const fresh = Boolean(
    chat.avatarCheckedAt && Date.now() - chat.avatarCheckedAt.getTime() < maxAgeMs,
  );
  // Instagram'da username asosiy ko'rsatkich; Facebook'da ism yetarli
  const hasIdentity = chat.platform === "instagram" ? Boolean(chat.username) : chat.name !== "";
  if (fresh && hasIdentity) return false;

  const settings = await getMetaSettings();
  if (!settings.pageToken) return false;

  const profile = await fetchProfile(chat.platform, chat.externalId, settings.pageToken);
  if (!profile) {
    await prisma.metaChat.update({
      where: { id: chat.id },
      data: { avatarCheckedAt: new Date() },
    });
    return false;
  }

  const data: { username?: string; name?: string; avatarPath?: string; avatarCheckedAt: Date } = {
    avatarCheckedAt: new Date(),
  };

  if (profile.username) data.username = profile.username;
  if (profile.displayName) {
    // Foydalanuvchi o'zi qo'ygan nom bo'lmasa, username'ni ko'rsatamiz
    data.name = profile.displayName;
  }

  if (profile.avatarUrl) {
    const saved = await downloadAvatar(profile.avatarUrl, chat.avatarPath);
    if (saved) data.avatarPath = saved;
  }

  await prisma.metaChat.update({ where: { id: chat.id }, data });
  return true;
}

/** Suhbat ochilganda profilni tekshirish (o'zgargan bo'lsa darhol yangilanadi) */
export async function refreshMetaAvatar(chatId: string): Promise<boolean> {
  return syncMetaChatProfile(chatId, 60 * 1000);
}
