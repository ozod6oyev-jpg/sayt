"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendChannelPost,
  sendTelegramMessage,
  setTelegramWebhook,
  telegramErrorCode,
  telegramWebhookUrl,
} from "@/lib/telegram";

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
  if (!chatRefId || body.length < 1 || body.length > 4000) {
    redirect("/admin/meta?reply=invalid");
  }

  const chat = await prisma.telegramChat.findUnique({ where: { id: chatRefId } });
  if (!chat) {
    redirect("/admin/meta?reply=invalid");
  }

  const result = await sendTelegramMessage(chat.chatId, body);
  if (!result.ok) {
    redirect("/admin/meta?reply=error");
  }

  await prisma.telegramMessage.create({
    data: {
      chatRefId: chat.id,
      tgMessageId: result.result.message_id,
      direction: "out",
      text: body,
      fromName: "Panel",
    },
  });

  await prisma.telegramChat.update({
    where: { id: chat.id },
    data: { lastMessageAt: new Date() },
  });

  revalidatePath("/admin/meta");
  redirect("/admin/meta?reply=sent");
}
