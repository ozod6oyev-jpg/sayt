import { prisma } from "./prisma";
import { sendPush } from "./push";

export type NotificationKind = "lead" | "telegram" | "meta";

/**
 * Adminlarga bildirishnoma yozadi. Xabar yuborilganda chaqiriladi —
 * xato bo'lsa asosiy oqim (xabar saqlash) to'xtamaydi.
 */
export async function notifyAdmins(input: {
  kind: NotificationKind;
  title: string;
  body?: string | null;
  href: string;
  icon?: string | null;
  /** Faqat shu adminga ko'rsatiladi (Telegram suhbati egasi). Bo'lmasa — hammaga */
  adminUserId?: string | null;
}): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        kind: input.kind,
        title: input.title.slice(0, 200),
        body: input.body ? input.body.slice(0, 500) : null,
        href: input.href,
        adminUserId: input.adminUserId ?? null,
      },
    });
  } catch (error) {
    console.error("Bildirishnoma yozilmadi:", (error as Error).message);
    return;
  }

  // Telefon/brauzerga OS bildirishnomasi (sayt yopiq bo'lsa ham keladi)
  await sendPush(
    {
      title: input.title.slice(0, 120),
      body: input.body ?? "",
      href: input.href,
      // Har suhbat alohida bildirishnoma bo'lib turadi, bir xil chatdagilar yangilanadi
      tag: `notify-${input.kind}-${input.href}`,
    },
    "admin",
    input.adminUserId ?? null,
  ).catch(() => null);
}

export type UnreadCounts = { total: number; lead: number; meta: number; telegram: number };

/** O'qilmagan bildirishnomalar soni (menyu indikatori uchun) */
export async function unreadCounts(viewer?: { id: string }): Promise<UnreadCounts> {
  const rows = await prisma.adminNotification.groupBy({
    by: ["kind"],
    where: {
      readAt: null,
      ...(viewer ? { OR: [{ adminUserId: null }, { adminUserId: viewer.id }] } : {}),
    },
    _count: { _all: true },
  });

  const count = (kind: string) => rows.find((row) => row.kind === kind)?._count._all ?? 0;

  const lead = count("lead");
  const meta = count("meta");
  const telegram = count("telegram");

  return { total: lead + meta + telegram, lead, meta, telegram };
}
