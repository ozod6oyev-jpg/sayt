"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCheck, MessageSquare } from "lucide-react";
import type { MetaCopy } from "@/lib/admin-copy/meta";
import { emitAdminCounts, type AdminCounts } from "@/lib/admin-events";
import { fullDate } from "@/lib/datetime";
import type { InboxChatItem, InboxMessage, InboxThreadData } from "@/lib/inbox-types";
import { cn } from "@/lib/utils";
import { InboxAvatar } from "./avatar";
import { InboxChatList } from "./chat-list";
import { InboxComposer } from "./composer";
import { InboxInfo } from "./info";
import { InboxThread } from "./thread";

type Filter = "all" | "telegram" | "facebook" | "instagram" | "threads";

type SyncResponse = {
  chats: InboxChatItem[];
  thread: InboxThreadData | null;
  firstUnreadId: string | null;
};

export function LiveInbox({
  filter,
  filters,
  initialItems,
  initialThread,
  initialDividerId,
  banners,
  copy,
  filterQuery,
}: {
  filter: Filter;
  filters: { value: Filter; label: string }[];
  initialItems: InboxChatItem[];
  initialThread: InboxThreadData | null;
  initialDividerId: string | null;
  banners: { tone: "ok" | "error"; text: string }[];
  copy: MetaCopy;
  filterQuery: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [thread, setThread] = useState(initialThread);
  const [pending, setPending] = useState<InboxMessage[]>([]);
  const [dividerId, setDividerId] = useState(initialDividerId);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  const openId = thread?.id ?? null;
  const openKind = thread?.kind ?? null;

  /** Yangi xabarlar va suhbatlar ro'yxatini 2 sekundda bir olib turadi */
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const query = new URLSearchParams({ tur: filter });
    if (openId) {
      query.set("chat", openId);
      if (openKind) query.set("kind", openKind);
    }
    const url = `/api/admin/inbox/sync?${query.toString()}`;

    const tick = async () => {
      try {
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        if (response.ok) {
          const data = (await response.json()) as SyncResponse;
          setItems(data.chats);

          if (data.thread && data.thread.id === openId) {
            setThread(data.thread);
            if (data.firstUnreadId) setDividerId(data.firstUnreadId);
          }
        }
      } catch {
        // tarmoq xatosi — keyingi urinishda davom etadi
      }

      if (!stopped) timer = setTimeout(tick, 2000);
    };

    void tick();

    return () => {
      stopped = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [filter, openId, openKind]);

  const messages = useMemo(() => {
    if (!thread) return [] as InboxMessage[];

    const visible = pending.filter(
      (item) =>
        !thread.messages.some(
          (message) =>
            message.direction === item.direction &&
            message.text === item.text &&
            Math.abs(new Date(message.createdAt).getTime() - new Date(item.createdAt).getTime()) <
              120_000,
        ),
    );

    return [...thread.messages, ...visible];
  }, [thread, pending]);

  // Suhbat almashganda yoki yangi xabar kelganda pastga tushish
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    if (atBottomRef.current) box.scrollTop = box.scrollHeight;
  }, [messages.length, openId]);

  /** Suhbatni ochish — sahifa almashmaydi */
  const selectChat = useCallback(
    async (id: string) => {
      setLoading(true);
      window.history.replaceState(null, "", `?chat=${id}${filterQuery}`);

      try {
        const response = await fetch(`/api/admin/inbox/sync?tur=${filter}&chat=${id}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as SyncResponse;

        if (data.thread) {
          setThread(data.thread);
          setPending([]);
          setDividerId(data.firstUnreadId ?? null);
          setItems((list) =>
            list.map((item) => (item.id === id ? { ...item, unread: 0 } : item)),
          );
          atBottomRef.current = true;
        }
      } catch {
        // xato bo'lsa eski holat qoladi
      } finally {
        setLoading(false);
      }
    },
    [filter, filterQuery],
  );

  const closeThread = useCallback(() => {
    setThread(null);
    setPending([]);
    setDividerId(null);
    window.history.replaceState(null, "", `?${filter === "all" ? "" : `tur=${filter}`}`);
  }, [filter]);

  /** Xabar yuborish — avval pufak ko'rinadi, keyin server javobi bilan almashadi */
  const send = useCallback(
    async (payload: FormData): Promise<boolean> => {
      const text = String(payload.get("text") ?? "");
      const media = payload.get("media");
      const isVideo = media instanceof File && media.type.startsWith("video/");
      const isAudio = media instanceof File && media.type.startsWith("audio/");
      const tempId = `temp-${Date.now()}`;

      const optimistic: InboxMessage = {
        id: tempId,
        direction: "out",
        text,
        author: copy.inboxYou,
        createdAt: new Date().toISOString(),
        mediaType: media instanceof File ? (isVideo ? "video" : isAudio ? "audio" : "photo") : null,
        mediaPath: null,
        readAt: null,
        status: "sending",
      };

      setPending((list) => [...list, optimistic]);
      atBottomRef.current = true;

      try {
        const response = await fetch("/api/admin/inbox/send", { method: "POST", body: payload });
        const data = (await response.json().catch(() => null)) as
          | { ok?: boolean; message?: InboxMessage }
          | null;

        if (!response.ok || !data?.ok || !data.message) {
          setPending((list) =>
            list.map((item) => (item.id === tempId ? { ...item, status: "failed" } : item)),
          );
          return false;
        }

        setPending((list) => list.filter((item) => item.id !== tempId));
        setThread((current) =>
          current ? { ...current, messages: [...current.messages, data.message as InboxMessage] } : current,
        );
        setItems((list) =>
          list.map((item) =>
            item.id === openId
              ? {
                  ...item,
                  lastText: text || (isAudio ? `[${copy.mediaVoice}]` : text),
                  lastOut: true,
                  time: "hozir",
                  ts: Date.now(),
                }
              : item,
          ),
        );

        return true;
      } catch {
        setPending((list) =>
          list.map((item) => (item.id === tempId ? { ...item, status: "failed" } : item)),
        );
        return false;
      }
    },
    [copy.inboxYou, copy.mediaVoice, openId],
  );

  async function markAllRead() {
    const response = await fetch("/api/admin/inbox/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => null);

    const data = response ? ((await response.json().catch(() => null)) as { counts?: AdminCounts } | null) : null;

    setItems((list) => list.map((item) => ({ ...item, unread: 0 })));
    setThread((current) =>
      current
        ? {
            ...current,
            messages: current.messages.map((message) =>
              message.direction === "in"
                ? { ...message, readAt: message.readAt ?? new Date().toISOString() }
                : message,
            ),
          }
        : current,
    );

    if (data?.counts) emitAdminCounts(data.counts);
  }

  const totalUnread = items.reduce((sum, item) => sum + item.unread, 0);
  const firstMessage = thread?.messages[0];
  const lastMessage = thread?.messages[thread.messages.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((item) => (
            <a
              key={item.value}
              href={item.value === "all" ? "/admin/meta/xabarlar" : `?tur=${item.value}`}
              className={
                filter === item.value
                  ? "rounded-full bg-brand-800 px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
              }
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            title={copy.liveHint}
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-600" />
            </span>
            {copy.live}
          </span>
          {totalUnread > 0 && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
              {totalUnread} {copy.inboxUnread}
            </span>
          )}
          {totalUnread > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="btn-secondary inline-flex items-center gap-1 text-xs"
            >
              <CheckCheck className="size-3.5" />
              {copy.inboxMarkAll}
            </button>
          )}
        </div>
      </div>

      {filter === "threads" && (
        <p className="rounded-lg bg-muted px-4 py-2.5 text-xs text-muted-foreground">
          {copy.threadsNote}
        </p>
      )}

      {banners.map((banner) => (
        <p
          key={banner.text}
          className={
            banner.tone === "ok"
              ? "rounded-lg bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700"
              : "rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-700"
          }
        >
          {banner.text}
        </p>
      ))}

      <div className="grid gap-3 md:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className={cn("card overflow-hidden", thread && "hidden md:block")}>
          <InboxChatList
            items={items}
            selectedId={thread?.id}
            filterQuery={filterQuery}
            onSelect={(id) => void selectChat(id)}
            copy={{
              title: copy.chatListTitle,
              search: copy.searchChats,
              empty: copy.inboxEmpty,
              noResults: copy.searchEmpty,
              you: copy.inboxYou,
            }}
          />
        </aside>

        <section
          className={cn(
            "card flex h-[75vh] min-h-[26rem] flex-col overflow-hidden",
            "max-md:fixed max-md:inset-0 max-md:z-[60] max-md:h-dvh max-md:min-h-0 max-md:rounded-none max-md:border-0",
            !thread && "hidden md:flex",
          )}
        >
          {thread ? (
            <>
              <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-3 py-2.5">
                <button
                  type="button"
                  onClick={closeThread}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
                  aria-label={copy.threadBack}
                >
                  <ArrowLeft className="size-4" />
                </button>

                <InboxAvatar name={thread.title} src={thread.avatar} size="lg" />

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                    {thread.title}
                    {thread.business && (
                      <span className="shrink-0 rounded-full bg-brand-50 px-1.5 text-[10px] font-medium text-brand-800">
                        {copy.businessBadge}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {thread.handle && thread.handle !== `@${thread.title}` ? `${thread.handle} · ` : ""}
                    {thread.subtitle} · {thread.messages.length} xabar
                  </p>
                </div>

                <InboxInfo
                  title={copy.chatInfo}
                  rows={[
                    { label: copy.infoId, value: thread.externalId },
                    { label: copy.infoUsername, value: thread.handle ?? "—" },
                    {
                      label: copy.infoPlatform,
                      value:
                        thread.platform === "telegram"
                          ? copy.filterTelegram
                          : thread.platform === "instagram"
                            ? copy.metaInstagram
                            : thread.platform === "threads"
                              ? copy.filterThreads
                              : copy.metaFacebook,
                    },
                    { label: copy.infoMessages, value: String(thread.messages.length) },
                    {
                      label: copy.infoFirst,
                      value: firstMessage ? fullDate(firstMessage.createdAt) : "—",
                    },
                    {
                      label: copy.infoLast,
                      value: lastMessage ? fullDate(lastMessage.createdAt) : "—",
                    },
                  ]}
                />
              </div>

              <div
                id="thread-scroll"
                ref={scrollRef}
                onScroll={(event) => {
                  const box = event.currentTarget;
                  atBottomRef.current =
                    box.scrollHeight - box.scrollTop - box.clientHeight < 120;
                }}
                className="flex-1 space-y-0 overflow-y-auto bg-muted/20 px-3 py-4"
              >
                <InboxThread
                  messages={messages}
                  dividerId={dividerId}
                  copy={{
                    empty: copy.threadEmpty,
                    photo: copy.mediaPhoto,
                    video: copy.mediaVideo,
                    voice: copy.mediaVoice,
                    file: copy.mediaFile,
                    read: copy.msgRead,
                    unread: copy.msgUnread,
                    sent: copy.msgSent,
                    sending: copy.sending,
                    failed: copy.inboxFail,
                    newMessages: copy.newMessages,
                  }}
                />
              </div>

              <InboxComposer
                kind={thread.kind}
                chatId={thread.id}
                onSend={send}
                copy={{
                  placeholder: copy.metaReplyPlaceholder,
                  send: copy.threadSend,
                  attach: copy.attach,
                  attachHint: copy.attachHint,
                  removeFile: copy.removeFile,
                  record: copy.voiceRecord,
                  recording: copy.voiceRecording,
                  cancelRecording: copy.voiceCancel,
                  micDenied: copy.voiceDenied,
                  quickReplies: copy.quickReplies,
                  quick1: copy.quick1,
                  quick2: copy.quick2,
                  quick3: copy.quick3,
                  sending: copy.sending,
                  failed: copy.inboxFail,
                }}
              />
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                  <MessageSquare className="size-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-foreground">{copy.pickChat}</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                  {copy.pickChatHint}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {loading && <p className="text-[11px] text-muted-foreground">{copy.sending}</p>}

      <p className="text-[11px] text-muted-foreground">{copy.tgMediaNote}</p>
    </div>
  );
}
