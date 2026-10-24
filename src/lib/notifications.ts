import { prisma } from "./prisma";

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
}): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        kind: input.kind,
        title: input.title.slice(0, 200),
        body: input.body ? input.body.slice(0, 500) : null,
        href: input.href,
      },
    });
  } catch (error) {
    console.error("Bildirishnoma yozilmadi:", (error as Error).message);
  }
}

export type UnreadCounts = { total: number; lead: number; meta: number; telegram: number };

/** O'qilmagan bildirishnomalar soni (menyu indikatori uchun) */
export async function unreadCounts(): Promise<UnreadCounts> {
  const rows = await prisma.adminNotification.groupBy({
    by: ["kind"],
    where: { readAt: null },
    _count: { _all: true },
  });

  const count = (kind: string) => rows.find((row) => row.kind === kind)?._count._all ?? 0;

  const lead = count("lead");
  const meta = count("meta");
  const telegram = count("telegram");

  return { total: lead + meta + telegram, lead, meta, telegram };
}
