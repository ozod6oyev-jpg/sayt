import { NextResponse } from "next/server";
import { metaCopy } from "@/lib/admin-copy/meta";
import { getAdminCopy } from "@/lib/admin-i18n";
import { getCurrentUser } from "@/lib/auth";
import { listChats, loadThread, markThreadRead } from "@/lib/inbox";
import { refreshChatAvatar } from "@/lib/telegram-avatar";

export const dynamic = "force-dynamic";

type Filter = "all" | "telegram" | "facebook" | "instagram" | "threads";

function parseFilter(value: string | null): Filter {
  return value === "telegram" || value === "facebook" || value === "instagram" || value === "threads"
    ? value
    : "all";
}

/**
 * Chat sahifasini jonli ushlab turadi: suhbatlar ro'yxati va ochiq suhbat
 * xabarlari. Sahifani qayta yuklamaydi.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const viewer = { id: user.id, role: user.role };

  const c = await getAdminCopy(metaCopy);
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chat");
  const kind = url.searchParams.get("kind") === "telegram" ? "telegram" : "meta";

  const labels = {
    you: c.inboxYou,
    businessBadge: c.businessBadge,
    mediaPhoto: c.mediaPhoto,
    mediaVideo: c.mediaVideo,
    mediaVoice: c.mediaVoice,
    noMessageYet: c.noMessageYet,
    metaInstagram: c.metaInstagram,
    metaFacebook: c.metaFacebook,
    filterTelegram: c.filterTelegram,
    filterThreads: c.filterThreads,
  };

  // Har chat ochilganda profil rasmi yangilangan-yangilanmaganini tekshiramiz
  if (chatId) await refreshChatAvatar(chatId);

  const chats = await listChats(parseFilter(url.searchParams.get("tur")), labels, viewer);

  if (!chatId) {
    return NextResponse.json({ ok: true, chats, thread: null, firstUnreadId: null });
  }

  const before = await loadThread(chatId, labels, viewer);
  const firstUnreadId =
    before?.messages.find((message) => message.direction === "in" && !message.readAt)?.id ?? null;

  // Ochiq turgan suhbat — o'qilgan deb belgilanadi (har safar faqat yangilari)
  await markThreadRead(kind, chatId, { viewer });

  const thread = await loadThread(chatId, labels, viewer);
  if (!thread) {
    return NextResponse.json({ ok: true, chats, thread: null, firstUnreadId: null });
  }

  return NextResponse.json({
    ok: true,
    chats,
    thread,
    firstUnreadId,
    you: c.inboxYou,
  });
}
