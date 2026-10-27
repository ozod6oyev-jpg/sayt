"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendChannelPost,
  sendTelegramMedia,
  sendTelegramMessage,
  setTelegramWebhook,
  telegramErrorCode,
  telegramWebhookUrl,
} from "@/lib/telegram";
import { botTokenForAdmin } from "@/lib/telegram-account";
import { extensionFromMime, saveMediaBuffer } from "@/lib/uploads";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Kanalga post yuborish */
export async function publishToChannel(formData: FormData): Promise<void> {
  await requireOwner();

  const body = text(formData, "text");
  if (body.length < 2 || body.length > 4000) {
    redirect("/admin/meta?tg=invalid");
  }

  const result = await sendChannelPost(body);
  if (!result.ok) {
    redirect(`/admin/meta?tg=${telegramErrorCode(result.description)}`);
  }

  revalidatePath("/admin/meta");
  redirect("/admin/meta?tg=sent");
}

/** Bot xabarlarini qabul qiladigan webhook'ni ulash */
export async function connectTelegramWebhook(): Promise<void> {
  await requireOwner();

  const result = await setTelegramWebhook(telegramWebhookUrl());
  if (!result.ok) {
    redirect("/admin/meta?hook=error");
  }

  revalidatePath("/admin/meta");
  redirect("/admin/meta?hook=ok");
}

/** Tanlangan chatga javob yozish */
export async function replyToTelegramChat(formData: FormData): Promise<void> {
  await requireOwner();

  const chatRefId = text(formData, "chatRefId");
  const body = text(formData, "text");
  const rawReturn = text(formData, "returnTo");
  const back = rawReturn.startsWith("/admin/meta/xabarlar") ? rawReturn : "/admin/meta/xabarlar";
  const withStatus = (key: string, value: string) =>
    `${back}${back.includes("?") ? "&" : "?"}${key}=${value}`;

  const mediaEntry = formData.get("media");
  const file = mediaEntry instanceof File && mediaEntry.size > 0 ? mediaEntry : null;
  const isVideo = Boolean(file?.type.startsWith("video/"));
  const isImage = Boolean(file?.type.startsWith("image/"));

  if (file) {
    const limit = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if ((!isVideo && !isImage) || file.size > limit || body.length > 1024) {
      redirect(withStatus("reply", "invalid"));
    }
  }

  if (!chatRefId || (!file && (body.length < 1 || body.length > 4000))) {
    redirect(withStatus("reply", "invalid"));
  }

  const chat = await prisma.telegramChat.findUnique({ where: { id: chatRefId } });
  if (!chat) {
    redirect(withStatus("reply", "invalid"));
  }

  const bot = await botTokenForAdmin(chat.adminUserId);

  let localMedia: string | null = null;
  let mediaType: string | null = null;
  let result;

  if (file) {
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

  if (!result.ok) {
    redirect(withStatus("reply", "error"));
  }

  await prisma.telegramMessage.create({
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

  await prisma.telegramChat.update({
    where: { id: chat.id },
    data: { lastMessageAt: new Date() },
  });

  revalidatePath("/admin/meta");
  revalidatePath(`/admin/meta/xabarlar/${chat.id}`);
  redirect(withStatus("reply", "sent"));
}
