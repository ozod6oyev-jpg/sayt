import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { publishDuePosts } from "@/lib/publish-post";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const provided = request.headers.get("x-cron-secret") ?? "";
  const a = Buffer.from(secret);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Vaqti kelgan rejalashtirilgan postlarni joylaydi (systemd timer chaqiradi) */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await publishDuePosts();
  return NextResponse.json({ ok: true, ...result });
}

export const POST = GET;
