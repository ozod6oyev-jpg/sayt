"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Suhbatdagi yoki butun inbox'dagi kelgan xabarlarni o'qilgan deb belgilash */
export async function markInboxRead(formData: FormData): Promise<void> {
  await requireAdmin();

  const kind = text(formData, "kind");
  const chatId = text(formData, "chatId");
  const all = text(formData, "all") === "1";

  if (!all && !chatId) {
    redirect("/admin/meta/xabarlar?read=invalid");
  }

  const where = { direction: "in", readAt: null } as const;

  const now = new Date();

  if (all) {
    await Promise.all([
      prisma.telegramMessage.updateMany({ where, data: { readAt: now } }),
      prisma.metaMessage.updateMany({ where, data: { readAt: now } }),
      prisma.adminNotification.updateMany({ where: { readAt: null }, data: { readAt: now } }),
    ]);
  } else if (kind === "telegram") {
    await Promise.all([
      prisma.telegramMessage.updateMany({
        where: { ...where, chatRefId: chatId },
        data: { readAt: now },
      }),
      prisma.adminNotification.updateMany({
        where: { kind: "telegram", readAt: null },
        data: { readAt: now },
      }),
    ]);
  } else {
    await Promise.all([
      prisma.metaMessage.updateMany({
        where: { ...where, chatRefId: chatId },
        data: { readAt: now },
      }),
      prisma.adminNotification.updateMany({
        where: { kind: "meta", readAt: null },
        data: { readAt: now },
      }),
    ]);
  }

  revalidatePath("/admin/meta/xabarlar");
  redirect("/admin/meta/xabarlar?read=done");
}
