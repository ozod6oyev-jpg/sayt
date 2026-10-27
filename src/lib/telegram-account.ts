import { randomBytes } from "crypto";
import { decryptSecret, encryptSecret } from "./crypto";
import { prisma } from "./prisma";
import { getBotInfo, verifyTelegramSecret } from "./telegram";

/**
 * Har bir admin o'z shaxsiy Telegram akkauntini panel hisobiga ulaydi.
 * Shunda kelgan mijoz xabarlari faqat shu adminning inbox'ida ko'rinadi.
 */

function newToken(): string {
  return randomBytes(9).toString("base64url");
}

/** Profil sahifasida ko'rsatiladigan bir martalik havola tokeni */
export async function createTelegramLinkToken(adminId: string): Promise<string> {
  const token = newToken();
  await prisma.adminUser.update({
    where: { id: adminId },
    data: { telegramLinkToken: token },
  });
  return token;
}

/** Bot username'idan `t.me/...?start=token` havolasini yasaydi */
export async function telegramLinkUrl(token: string): Promise<string | null> {
  if (!token) return null;

  const bot = await getBotInfo();
  if (!bot.ok || !bot.result.username) return null;

  return `https://t.me/${bot.result.username}?start=${token}`;
}

/** Botga ilgari ulangan Business akkauntlar va suhbatlarni shu adminga o'tkazadi */
export async function claimTelegramChats(
  adminId: string,
  telegramUserId: string,
  includeDirect: boolean,
): Promise<void> {
  const connections = await prisma.telegramBusiness.findMany({
    where: { ownerId: telegramUserId },
    select: { id: true },
  });

  await prisma.telegramBusiness.updateMany({
    where: { ownerId: telegramUserId },
    data: { adminUserId: adminId },
  });

  if (connections.length > 0) {
    await prisma.telegramChat.updateMany({
      where: { businessConnectionId: { in: connections.map((row) => row.id) } },
      data: { adminUserId: adminId },
    });
  }

  await prisma.telegramChat.updateMany({
    where: { businessOwnerId: telegramUserId },
    data: { adminUserId: adminId },
  });

  // Botga to'g'ridan-to'g'ri yozganlar — bot egasining (owner) suhbatlari
  if (includeDirect) {
    await prisma.telegramChat.updateMany({
      where: { adminUserId: null, businessConnectionId: null },
      data: { adminUserId: adminId },
    });
  }
}

/** Havoladagi token bo'yicha Telegram akkauntini panel hisobiga bog'laydi */
export async function linkTelegramAccount(input: {
  token: string;
  telegramUserId: string;
  username?: string | null;
}): Promise<{ ok: boolean; name: string | null }> {
  if (!input.token || !input.telegramUserId) return { ok: false, name: null };

  const user = await prisma.adminUser.findUnique({
    where: { telegramLinkToken: input.token },
    select: { id: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return { ok: false, name: null };

  const taken = await prisma.adminUser.findFirst({
    where: { telegramUserId: input.telegramUserId, id: { not: user.id } },
    select: { id: true },
  });
  if (taken) return { ok: false, name: null };

  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      telegramUserId: input.telegramUserId,
      telegramUsername: input.username ?? null,
      telegramLinkToken: null,
      telegramLinkedAt: new Date(),
    },
  });

  await claimTelegramChats(user.id, input.telegramUserId, user.role === "owner");

  return { ok: true, name: user.name };
}

/** Admin hisobidan Telegram ulanishini uziadi (suhbatlar o'zida qoladi) */
export async function unlinkTelegramAccount(adminId: string): Promise<void> {
  await prisma.adminUser.update({
    where: { id: adminId },
    data: {
      telegramUserId: null,
      telegramUsername: null,
      telegramLinkToken: null,
      telegramLinkedAt: null,
    },
  });
}

/** Telegram user ID bo'yicha panel hisobini topadi */
export async function adminForTelegramUser(
  telegramUserId: string,
): Promise<{ id: string; name: string } | null> {
  if (!telegramUserId) return null;

  return prisma.adminUser
    .findUnique({
      where: { telegramUserId },
      select: { id: true, name: true },
    })
    .catch(() => null);
}

/** Har bir adminning shaxsiy boti uchun yangi webhook siri */
export function newBotSecret(): string {
  return randomBytes(24).toString("hex");
}

/** Admin hisobiga bog'langan bot tokeni (shifrdan ochilgan) */
export async function botTokenForAdmin(
  adminId: string | null | undefined,
): Promise<string | null> {
  if (!adminId) return null;

  const row = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { telegramBotToken: true, isActive: true },
  });

  if (!row?.isActive) return null;
  return decryptSecret(row.telegramBotToken);
}

/**
 * Webhook sarlavhasidagi sir bo'yicha qaysi bot update yuborayotganini aniqlaydi:
 * owner boti (env) yoki adminning shaxsiy boti.
 */
export async function botForWebhookSecret(
  secretHeader: string | null,
): Promise<{ token: string | null; adminUserId: string | null } | null> {
  if (!secretHeader) return null;

  if (verifyTelegramSecret(secretHeader)) {
    return { token: null, adminUserId: await ownerAdminId() };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { telegramBotSecret: secretHeader },
    select: { id: true, isActive: true, telegramBotToken: true },
  });

  if (!admin?.isActive) return null;

  const token = decryptSecret(admin.telegramBotToken);
  if (!token) return null;

  return { token, adminUserId: admin.id };
}

/** Adminning shaxsiy botini saqlaydi (token shifrlanadi) */
export async function saveAdminTelegramBot(input: {
  adminId: string;
  token: string;
  username: string | null;
  botId: string;
  secret: string;
}): Promise<void> {
  await prisma.adminUser.update({
    where: { id: input.adminId },
    data: {
      telegramBotToken: encryptSecret(input.token),
      telegramBotUsername: input.username,
      telegramBotId: input.botId,
      telegramBotSecret: input.secret,
      telegramBotAt: new Date(),
    },
  });
}

/** Adminning shaxsiy botini uzadi */
export async function clearAdminTelegramBot(adminId: string): Promise<void> {
  await prisma.adminUser.update({
    where: { id: adminId },
    data: {
      telegramBotToken: null,
      telegramBotUsername: null,
      telegramBotId: null,
      telegramBotSecret: null,
      telegramBotAt: null,
    },
  });
}

/** Botga to'g'ridan-to'g'ri yozganlar uchun standart egasi — owner hisobi */
export async function ownerAdminId(): Promise<string | null> {
  const owner = await prisma.adminUser.findFirst({
    where: { role: "owner", isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return owner?.id ?? null;
}
