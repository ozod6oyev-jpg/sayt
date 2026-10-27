import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Body = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

/** Sayt mehmoni obunasi (yangi e'lon va maqolalar) */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const user = await getCurrentUser().catch(() => null);

  await prisma.pushSubscription.upsert({
    where: { endpoint_scope: { endpoint, scope: "site" } },
    create: {
      endpoint,
      p256dh,
      auth,
      scope: "site",
      adminId: user?.id ?? null,
      userAgent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
    },
    update: { p256dh, auth, scope: "site", lastAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const endpoint = body.endpoint?.trim();
  if (!endpoint) return NextResponse.json({ ok: false }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, scope: "site" } });

  return NextResponse.json({ ok: true });
}
