import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Body = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

/** Telefon/brauzer obunasini saqlash */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint_scope: { endpoint, scope: "admin" } },
    create: {
      endpoint,
      p256dh,
      auth,
      scope: "admin",
      adminId: user.id,
      userAgent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
    },
    update: { p256dh, auth, scope: "admin", adminId: user.id, lastAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

/** Obunani o'chirish */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const endpoint = body.endpoint?.trim();

  if (!endpoint) return NextResponse.json({ ok: false }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, scope: "admin" } });

  return NextResponse.json({ ok: true });
}
