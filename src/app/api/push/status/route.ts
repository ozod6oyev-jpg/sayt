import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Shu qurilma qaysi bildirishnomalarga obuna bo'lganini qaytaradi */
export async function GET(request: Request) {
  const endpoint = new URL(request.url).searchParams.get("endpoint")?.trim();
  if (!endpoint) return NextResponse.json({ ok: false, scopes: [] }, { status: 400 });

  const rows = await prisma.pushSubscription.findMany({
    where: { endpoint },
    select: { scope: true },
  });

  return NextResponse.json({ ok: true, scopes: rows.map((row) => row.scope) });
}
