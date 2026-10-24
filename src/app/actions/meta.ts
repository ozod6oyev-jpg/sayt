"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkMetaConnection, saveMetaSettings, sendMetaMessage } from "@/lib/meta";
import { getMetaSettings } from "@/lib/meta";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Meta ilova kalitlari va Page tokenni saqlash */
export async function saveMetaSettingsAction(formData: FormData): Promise<void> {
  await requireOwner();

  await saveMetaSettings({
    appId: text(formData, "appId"),
    appSecret: text(formData, "appSecret"),
    pageId: text(formData, "pageId"),
    pageToken: text(formData, "pageToken"),
    igUserId: text(formData, "igUserId"),
  });

  revalidatePath("/admin/meta");
  redirect("/admin/meta?meta=saved");
}

/** Page token bilan sahifa va Instagram akkauntni tekshirish */
export async function testMetaConnectionAction(): Promise<void> {
  await requireOwner();

  const settings = await getMetaSettings();
  if (!settings.pageId || !settings.pageToken) {
    redirect("/admin/meta?meta=missing");
  }

  const result = await checkMetaConnection();
  revalidatePath("/admin/meta");
  redirect(`/admin/meta?meta=${result.ok ? "ok" : "error"}`);
}

/** Facebook yoki Instagram suhbatiga javob yozish */
export async function replyToMetaChat(formData: FormData): Promise<void> {
  await requireOwner();

  const chatRefId = text(formData, "chatRefId");
  const body = text(formData, "text");
  if (!chatRefId || body.length < 1 || body.length > 2000) {
    redirect("/admin/meta?metaReply=invalid");
  }

  const chat = await prisma.metaChat.findUnique({ where: { id: chatRefId } });
  if (!chat) {
    redirect("/admin/meta?metaReply=invalid");
  }

  const result = await sendMetaMessage(
    chat.platform === "instagram" ? "instagram" : "facebook",
    chat.externalId,
    body,
  );

  if (!result.ok) {
    redirect("/admin/meta?metaReply=error");
  }

  await prisma.metaMessage.create({
    data: {
      chatRefId: chat.id,
      externalId: result.result.message_id ?? null,
      direction: "out",
      text: body,
    },
  });

  await prisma.metaChat.update({
    where: { id: chat.id },
    data: { lastMessageAt: new Date() },
  });

  revalidatePath("/admin/meta");
  redirect("/admin/meta?metaReply=sent");
}
