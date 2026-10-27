import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Long-polling: yangi xabar kelishi bilan javob qaytaradi.
 * Hech narsa kelmasa 25 soniyadan keyin bo'sh javob beradi (client qayta so'raydi).
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const sinceParam = new URL(request.url).searchParams.get("since");
  const sinceDate =
    sinceParam && Number.isFinite(Date.parse(sinceParam)) ? new Date(sinceParam) : new Date();

  const deadline = Date.now() + 25_000;

  while (true) {
    try {
      const [tg, meta] = await Promise.all([
        prisma.telegramMessage.findFirst({
          where: { createdAt: { gt: sinceDate }, direction: "in" },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
        prisma.metaMessage.findFirst({
          where: { createdAt: { gt: sinceDate }, direction: "in" },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
      ]);

      const dates = [tg?.createdAt, meta?.createdAt].filter((date): date is Date => Boolean(date));

      if (dates.length > 0) {
        const latest = new Date(Math.max(...dates.map((date) => date.getTime())));

        const [tgUnread, metaUnread] = await Promise.all([
          prisma.telegramMessage.count({ where: { direction: "in", readAt: null } }),
          prisma.metaMessage.count({ where: { direction: "in", readAt: null } }),
        ]);

        return NextResponse.json({
          ok: true,
          latest: latest.toISOString(),
          unread: tgUnread + metaUnread,
        });
      }
    } catch {
      // baza vaqtincha javob bermasa — biroz kutib qayta urinamiz
    }

    if (Date.now() >= deadline) {
      return NextResponse.json({ ok: true, latest: null });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
