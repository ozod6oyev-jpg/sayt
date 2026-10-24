import Link from "next/link";
import { replyToMetaChat } from "@/app/actions/meta";
import { markInboxRead } from "@/app/actions/inbox";
import { replyToTelegramChat } from "@/app/actions/telegram";
import { metaCopy } from "@/lib/admin-copy/meta";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Filter = "all" | "telegram" | "facebook" | "instagram";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type InboxMessage = {
  id: string;
  direction: string;
  text: string;
  author: string;
};

type InboxChat = {
  kind: "telegram" | "facebook" | "instagram";
  id: string;
  title: string;
  subtitle: string;
  time: Date;
  unread: number;
  messages: InboxMessage[];
};

export default async function MetaInboxPage({ searchParams }: PageProps) {
  await requireOwner();

  const c = await getAdminCopy(metaCopy);
  const params = await searchParams;
  const rawFilter = first(params.tur);
  const filter: Filter =
    rawFilter === "telegram" || rawFilter === "facebook" || rawFilter === "instagram"
      ? rawFilter
      : "all";

  const replyStatus = first(params.reply);
  const metaReplyStatus = first(params.metaReply);

  const [telegramChats, metaChats] = await Promise.all([
    filter === "all" || filter === "telegram"
      ? prisma.telegramChat.findMany({
          orderBy: { lastMessageAt: "desc" },
          take: 20,
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 6 },
            _count: { select: { messages: { where: { direction: "in", readAt: null } } } },
          },
        })
      : Promise.resolve([]),
    filter === "facebook" || filter === "instagram"
      ? prisma.metaChat.findMany({
          where: { platform: filter },
          orderBy: { lastMessageAt: "desc" },
          take: 20,
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 6 },
            _count: { select: { messages: { where: { direction: "in", readAt: null } } } },
          },
        })
      : filter === "all"
        ? prisma.metaChat.findMany({
            orderBy: { lastMessageAt: "desc" },
            take: 20,
            include: {
              messages: { orderBy: { createdAt: "desc" }, take: 6 },
              _count: { select: { messages: { where: { direction: "in", readAt: null } } } },
            },
          })
        : Promise.resolve([]),
  ]);

  const items: InboxChat[] = [
    ...telegramChats.map((chat) => ({
      kind: "telegram" as const,
      id: chat.id,
      title: chat.title,
      subtitle: chat.username ? `@${chat.username}` : chat.type,
      time: chat.lastMessageAt,
      unread: chat._count.messages,
      messages: [...chat.messages].reverse().map((message) => ({
        id: message.id,
        direction: message.direction,
        text: message.text,
        author: message.direction === "out" ? c.inboxYou : (message.fromName ?? chat.title),
      })),
    })),
    ...metaChats.map((chat) => ({
      kind: chat.platform === "instagram" ? ("instagram" as const) : ("facebook" as const),
      id: chat.id,
      title: chat.name,
      subtitle: chat.platform === "instagram" ? c.metaInstagram : c.metaFacebook,
      time: chat.lastMessageAt,
      unread: chat._count.messages,
      messages: [...chat.messages].reverse().map((message) => ({
        id: message.id,
        direction: message.direction,
        text: message.text,
        author: message.direction === "out" ? c.inboxYou : chat.name,
      })),
    })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime());

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: c.filterAll },
    { value: "telegram", label: c.filterTelegram },
    { value: "facebook", label: c.filterFacebook },
    { value: "instagram", label: c.filterInstagram },
  ];

  const platformBadge = (kind: InboxChat["kind"]) =>
    kind === "telegram" ? c.filterTelegram : kind === "instagram" ? c.metaInstagram : c.metaFacebook;

  const banners: { tone: "ok" | "error"; text: string }[] = [];
  if (replyStatus === "sent") banners.push({ tone: "ok", text: c.inboxSent });
  if (replyStatus === "invalid" || replyStatus === "error") {
    banners.push({ tone: "error", text: c.inboxFail });
  }
  if (metaReplyStatus === "sent") banners.push({ tone: "ok", text: c.metaReplySent });
  if (metaReplyStatus === "invalid" || metaReplyStatus === "error") {
    banners.push({ tone: "error", text: c.metaReplyFail });
  }
  if (first(params.read) === "done") banners.push({ tone: "ok", text: c.inboxReadDone });

  const totalUnread = items.reduce((sum, chat) => sum + chat.unread, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((item) => (
            <Link
              key={item.value}
              href={item.value === "all" ? "/admin/meta/xabarlar" : `?tur=${item.value}`}
              className={
                filter === item.value
                  ? "rounded-full bg-brand-800 px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full border border-slate-200 bg-card px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
              {totalUnread} {c.inboxUnread}
            </span>
          )}
          {totalUnread > 0 && (
            <form action={markInboxRead}>
              <input type="hidden" name="all" value="1" />
              <button type="submit" className="btn-secondary text-xs">
                {c.inboxMarkAll}
              </button>
            </form>
          )}
          <p className="text-xs text-slate-500">{c.inboxHint}</p>
        </div>
      </div>

      {banners.map((banner) => (
        <p
          key={banner.text}
          className={
            banner.tone === "ok"
              ? "rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {banner.text}
        </p>
      ))}

      {items.length === 0 ? (
        <div className="card px-4 py-14 text-center">
          <p className="text-sm text-slate-500">{c.inboxEmpty}</p>
          <p className="mt-1 text-xs text-slate-500">{c.inboxHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((chat) => (
            <div key={`${chat.kind}-${chat.id}`} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{chat.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {chat.subtitle} · {formatDateTime(chat.time)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {chat.unread > 0 && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      {chat.unread} {c.inboxUnread}
                    </span>
                  )}
                  {chat.unread > 0 && (
                    <form action={markInboxRead}>
                      <input type="hidden" name="kind" value={chat.kind} />
                      <input type="hidden" name="chatId" value={chat.id} />
                      <button type="submit" className="text-[11px] font-semibold text-brand-700 hover:underline">
                        {c.inboxMarkRead}
                      </button>
                    </form>
                  )}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {platformBadge(chat.kind)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 px-4 py-3">
                {chat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.direction === "out"
                        ? "ml-auto max-w-[85%] rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs text-brand-800"
                        : "mr-auto max-w-[85%] rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700"
                    }
                  >
                    <p className="text-[10px] font-semibold text-slate-500">{message.author}</p>
                    <p className="mt-0.5 break-words whitespace-pre-wrap">{message.text}</p>
                  </div>
                ))}
              </div>

              <form
                action={chat.kind === "telegram" ? replyToTelegramChat : replyToMetaChat}
                className="flex flex-col gap-2 border-t border-slate-100 p-3 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="chatRefId" value={chat.id} />
                <div className="flex-1">
                  <label className="label" htmlFor={`reply-${chat.kind}-${chat.id}`}>
                    {c.metaReply}
                  </label>
                  <input
                    id={`reply-${chat.kind}-${chat.id}`}
                    name="text"
                    required
                    maxLength={chat.kind === "telegram" ? 4000 : 2000}
                    placeholder={c.metaReplyPlaceholder}
                    className="field"
                  />
                </div>
                <button type="submit" className="btn-primary text-xs">
                  {c.metaReplySend}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-500">{c.tgMediaNote}</p>
    </div>
  );
}
