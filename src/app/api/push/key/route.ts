import { NextResponse } from "next/server";
import { pushPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

/** Brauzer obuna bo'lishi uchun ochiq VAPID kaliti */
export function GET() {
  const key = pushPublicKey();
  if (!key) return NextResponse.json({ ok: false }, { status: 503 });

  return NextResponse.json({ ok: true, key });
}
