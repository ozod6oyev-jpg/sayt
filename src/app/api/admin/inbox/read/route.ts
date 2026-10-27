import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markThreadRead } from "@/lib/inbox";
import { unreadCounts } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/** Suhbatni yoki butun inbox'ni o'qilgan deb belgilash */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    id?: string;
    all?: boolean;
  };

  const viewer = { id: user.id, role: user.role };

  if (body.all) {
    await markThreadRead("telegram", "", { all: true, viewer });
    return NextResponse.json({ ok: true, counts: await unreadCounts(user) });
  }

  if (!body.id) return NextResponse.json({ ok: false }, { status: 400 });

  await markThreadRead(body.kind === "telegram" ? "telegram" : "meta", body.id, { viewer });

  return NextResponse.json({ ok: true, counts: await unreadCounts(user) });
}
