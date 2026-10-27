import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { unreadCounts } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Long-polling: yangi bildirishnoma paydo bo'lishi bilan javob qaytaradi.
 * Hech narsa kelmasa 25 soniyadan keyin bo'sh javob beradi (client qayta so'raydi).
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const sinceParam = new URL(request.url).searchParams.get("since");
  const sinceDate =
    sinceParam && Number.isFinite(Date.parse(sinceParam)) ? new Date(sinceParam) : new Date();

  const deadline = Date.now() + 25_000;
  // Umumiy bildirishnomalar + faqat shu adminga tegishlilari
  const visible = { OR: [{ adminUserId: null }, { adminUserId: user.id }] };

  while (true) {
    try {
      const found = await prisma.adminNotification.findMany({
        where: { createdAt: { gt: sinceDate }, ...visible },
        orderBy: { createdAt: "asc" },
        take: 10,
        select: {
          id: true,
          kind: true,
          title: true,
          body: true,
          href: true,
          readAt: true,
          createdAt: true,
        },
      });

      if (found.length > 0) {
        return NextResponse.json({ ok: true, items: found, counts: await unreadCounts(user) });
      }
    } catch {
      // baza vaqtincha javob bermasa — biroz kutib qayta urinamiz
    }

    if (Date.now() >= deadline) {
      return NextResponse.json({ ok: true, items: [], counts: await unreadCounts(user) });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
