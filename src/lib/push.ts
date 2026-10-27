import webpush from "web-push";
import { prisma } from "./prisma";

let configured = false;

function configure(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

  if (!publicKey || !privateKey) return false;

  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT?.trim() || "mailto:admin@localhost",
      publicKey,
      privateKey,
    );
    configured = true;
  }

  return true;
}

export function pushPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

export type PushScope = "admin" | "site";

export type PushPayload = {
  title: string;
  body?: string | null;
  href: string;
  tag?: string;
  icon?: string | null;
  /** Bildirishnomadagi tugma matni (masalan «E'lonni ko'rish») */
  action?: string | null;
};

/**
 * Ro'yxatdan o'tgan barcha qurilmalarga (telefon/brauzer) OS bildirishnomasi yuboradi.
 * Muddati o'tgan obunalar bazadan tozalanadi.
 */
export async function sendPush(
  payload: PushPayload,
  scope: PushScope = "admin",
  /** Faqat shu adminning qurilmalariga (null — barcha adminlar) */
  adminId: string | null = null,
): Promise<{ delivered: number; total: number }> {
  if (!configure()) return { delivered: 0, total: 0 };

  const subscriptions = await prisma.pushSubscription
    .findMany({ where: adminId ? { scope, adminId } : { scope } })
    .catch(() => []);
  if (subscriptions.length === 0) return { delivered: 0, total: 0 };

  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.META_PUBLIC_BASE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");

  const icon = payload.icon
    ? payload.icon.startsWith("http")
      ? payload.icon
      : `${origin}${payload.icon}`
    : null;

  const body = JSON.stringify({
    title: payload.title.slice(0, 120),
    body: (payload.body ?? "").slice(0, 200),
    url: payload.href,
    tag: payload.tag ?? "admin",
    icon,
    action: payload.action ?? null,
  });

  let delivered = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          body,
          { TTL: 60 * 60 },
        );

        delivered += 1;

        await prisma.pushSubscription
          .update({ where: { id: subscription.id }, data: { lastAt: new Date() } })
          .catch(() => null);
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        console.error(
          "[push] yuborilmadi:",
          status ?? "-",
          (error as Error).message?.slice(0, 120),
          ((error as { body?: string }).body ?? "").slice(0, 200),
        );

        // Obuna bekor qilingan yoki muddati o'tgan — qurilma ro'yxatdan chiqadi
        if (status === 404 || status === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: subscription.id } })
            .catch(() => null);
        }
      }
    }),
  );

  console.log(`[push] yuborildi: ${delivered}/${subscriptions.length}`, payload.title.slice(0, 40));

  return { delivered, total: subscriptions.length };
}
