"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createTelegramLinkToken, unlinkTelegramAccount } from "@/lib/telegram-account";

/** Profil → Telegram: yangi ulanish havolasini yaratadi */
export async function startTelegramLink(): Promise<void> {
  const user = await requireAdmin();

  await createTelegramLinkToken(user.id);
  revalidatePath("/admin/profil");
  redirect("/admin/profil?tg=link");
}

/** Telegram ulanishini uziadi (suhbatlar panelda qoladi) */
export async function stopTelegramLink(): Promise<void> {
  const user = await requireAdmin();

  await unlinkTelegramAccount(user.id);
  revalidatePath("/admin/profil");
  redirect("/admin/profil?tg=unlinked");
}
