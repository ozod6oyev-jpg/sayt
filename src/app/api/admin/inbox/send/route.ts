import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendReply } from "@/lib/inbox";

export const dynamic = "force-dynamic";

/** Chatdan javob yuborish — sahifa qayta yuklanmaydi */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const kindValue = formData.get("kind");
  const chatIdValue = formData.get("chatId");
  const textValue = formData.get("text");
  const mediaValue = formData.get("media");

  const kind = kindValue === "meta" ? "meta" : "telegram";
  const chatId = typeof chatIdValue === "string" ? chatIdValue : "";
  const text = typeof textValue === "string" ? textValue : "";
  const file = mediaValue instanceof File && mediaValue.size > 0 ? mediaValue : null;

  const result = await sendReply({
    kind,
    chatId,
    text,
    file,
    viewer: { id: user.id, role: user.role },
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, description: result.description },
      { status: result.error === "invalid" ? 400 : 502 },
    );
  }

  return NextResponse.json({ ok: true, message: result.message });
}
