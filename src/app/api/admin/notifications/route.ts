import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { unreadCounts } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** O'qilmagan bildirishnomalar ro'yxati */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const [items, counts] = await Promise.all([
    prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, kind: true, title: true, body: true, href: true, readAt: true, createdAt: true },
    }),
    unreadCounts(),
  ]);

  return NextResponse.json({ ok: true, counts, items });
}

/** Bittasini yoki hammasini o'qilgan deb belgilash */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { id?: string; all?: boolean };

  if (body.all) {
    await prisma.adminNotification.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
  } else if (body.id) {
    await prisma.adminNotification.updateMany({
      where: { id: body.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, counts: await unreadCounts() });
}
