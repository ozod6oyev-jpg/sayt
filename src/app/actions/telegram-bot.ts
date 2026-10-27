"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { deleteTelegramWebhook, getBotInfo, setTelegramWebhook, telegramWebhookUrl } from "@/lib/telegram";
import {
  clearAdminTelegramBot,
  newBotSecret,
  saveAdminTelegramBot,
} from "@/lib/telegram-account";

const BACK = "/admin/profil";
const TOKEN_PATTERN = /^\d{6,}:[A-Za-z0-9_-]{20,}$/;

/** Profil → Shaxsiy Telegram bot: tokenni tekshirib, webhookni ulab saqlaydi */
export async function saveOwnTelegramBot(formData: FormData): Promise<void> {
  const user = await requireAdmin();

  if (user.role === "owner") redirect(`${BACK}?bot=owner`);

  const raw = formData.get("token");
  const token = typeof raw === "string" ? raw.trim() : "";
  if (!TOKEN_PATTERN.test(token)) redirect(`${BACK}?bot=invalid`);

  const info = await getBotInfo(token);
  if (!info.ok) redirect(`${BACK}?bot=invalid`);

  const botId = String(info.result.id);

  // Bitta bot ikki hisobda ishlatilmaydi
  const taken = await prisma.adminUser.findFirst({
    where: { telegramBotId: botId, id: { not: user.id } },
    select: { id: true },
  });
  if (taken) redirect(`${BACK}?bot=taken`);

  // Eski bot bo'lsa webhookini uchiramiz — update boshqa joyga ketmasin
  const previous = decryptSecret(user.telegramBotToken);
  if (previous && previous !== token) {
    await deleteTelegramWebhook(previous).catch(() => null);
  }

  const secret = newBotSecret();
  const hook = await setTelegramWebhook(telegramWebhookUrl(), { bot: token, secret });
  if (!hook.ok) redirect(`${BACK}?bot=webhook`);

  await saveAdminTelegramBot({
    adminId: user.id,
    token,
    username: info.result.username ?? null,
    botId,
    secret,
  });

  revalidatePath(BACK);
  redirect(`${BACK}?bot=saved`);
}

/** Profil → Shaxsiy Telegram bot: ulanishni uziadi */
export async function removeOwnTelegramBot(): Promise<void> {
  const user = await requireAdmin();

  if (user.role === "owner") redirect(`${BACK}?bot=owner`);

  const token = decryptSecret(user.telegramBotToken);
  if (token) await deleteTelegramWebhook(token).catch(() => null);

  await clearAdminTelegramBot(user.id);
  revalidatePath(BACK);
  redirect(`${BACK}?bot=removed`);
}
