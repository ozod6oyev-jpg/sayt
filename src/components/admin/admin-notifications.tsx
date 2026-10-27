"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { ADMIN_COUNTS_EVENT, emitAdminCounts, type AdminCounts } from "@/lib/admin-events";
import { cn } from "@/lib/utils";
import { PushRow } from "./push-toggle";

type Item = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string;
  readAt: string | null;
  createdAt: string;
};

type Counts = { total: number };

type PushCopy = {
  title: string;
  hintOn: string;
  hintOff: string;
  denied: string;
  unsupported: string;
  turnOn: string;
  turnOff: string;
  test: string;
  testOk: string;
  testFail: string;
};

type Props = {
  initialUnread: number;
  title: string;
  empty: string;
  markAll: string;
  push: PushCopy;
};

function timeLabel(value: string): string {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AdminNotifications({ initialUnread, title, empty, markAll, push }: Props) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Item[]>([]);
  const [toasts, setToasts] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const router = useRouter();

  /** Brauzer ovozni faqat foydalanuvchi harakatidan keyin ijozat beradi */
  useEffect(() => {
    function unlock() {
      const Ctor = window.AudioContext;
      if (!Ctor) return;
      if (!audioRef.current) audioRef.current = new Ctor();
      void audioRef.current.resume().catch(() => null);
    }

    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  function beep() {
    const ctx = audioRef.current;
    if (!ctx) return;

    try {
      const start = ctx.currentTime;
      [0, 0.2].forEach((offset, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = index === 0 ? 880 : 1245;
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.16, start + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start + offset);
        osc.stop(start + offset + 0.2);
      });
    } catch {
      // ovoz chiqmasa ham bildirishnoma ko'rinadi
    }
  }

  function pushToast(item: Item) {
    setToasts((prev) => [item, ...prev.filter((entry) => entry.id !== item.id)].slice(0, 3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((entry) => entry.id !== item.id));
    }, 8000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store" });
      const data = (await response.json()) as { counts?: Counts; items?: Item[] };
      setUnread(data.counts?.total ?? 0);
      setItems(data.items ?? []);
    } catch {
      // tarmoq xatosi — keyingi urinishda qayta olinadi
    } finally {
      setLoading(false);
    }
  }, []);

  /** Yangi bildirishnomalarni kutib turadi (long-polling) — deyarli darhol keladi */
  useEffect(() => {
    let stopped = false;
    const controller = new AbortController();
    let since = new Date().toISOString();

    async function loop() {
      while (!stopped) {
        try {
          const response = await fetch(
            `/api/admin/notifications/watch?since=${encodeURIComponent(since)}`,
            { cache: "no-store", signal: controller.signal },
          );

          if (!response.ok) {
            await sleep(8000);
            continue;
          }

          const data = (await response.json()) as { items?: Item[]; counts?: AdminCounts };
          if (typeof data.counts?.total === "number") setUnread(data.counts.total);
          if (data.counts) emitAdminCounts(data.counts);

          if (data.items && data.items.length > 0) {
            const fresh = data.items;
            since = fresh[fresh.length - 1]?.createdAt ?? since;

            setItems((prev) => {
              const known = new Set(prev.map((entry) => entry.id));
              return [...fresh.filter((entry) => !known.has(entry.id)).reverse(), ...prev].slice(0, 20);
            });

            for (const item of fresh.slice(-2)) pushToast(item);
            beep();
          }
        } catch {
          if (stopped) return;
          await sleep(8000);
        }
      }
    }

    void loop();
    return () => {
      stopped = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    function onCounts(event: Event) {
      const detail = (event as CustomEvent<AdminCounts>).detail;
      if (detail && typeof detail.total === "number") setUnread(detail.total);
    }

    window.addEventListener(ADMIN_COUNTS_EVENT, onCounts);
    return () => window.removeEventListener(ADMIN_COUNTS_EVENT, onCounts);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markRead(id?: string) {
    const response = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    }).catch(() => null);

    const data = response ? ((await response.json().catch(() => null)) as { counts?: AdminCounts } | null) : null;
    if (data?.counts) {
      setUnread(data.counts.total);
      emitAdminCounts(data.counts);
    }

    if (id) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)),
      );
      setUnread((value) => Math.max(0, value - 1));
    } else {
      setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
      setUnread(0);
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative flex size-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-accent",
          unread > 0 && "border-brand-200 text-brand-800",
        )}
        aria-label={title}
      >
        <Bell className={cn("size-4", unread > 0 && "text-brand-700")} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[4.5rem] z-[60] overflow-hidden rounded-xl border border-border bg-background shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-foreground">{title}</p>
            <button
              type="button"
              onClick={() => void markRead()}
              className="flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline"
            >
              <CheckCheck className="size-3" />
              {markAll}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />…
              </p>
            )}

            {!loading && items.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">{empty}</p>
            )}

            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={async () => {
                  if (!item.readAt) await markRead(item.id);
                  setOpen(false);
                  router.push(item.href);
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 border-b border-border/60 px-3 py-2 text-left last:border-0 hover:bg-accent",
                  !item.readAt && "bg-brand-50/40",
                )}
              >
                <span className="flex items-center gap-1.5">
                  {!item.readAt && <span className="size-1.5 shrink-0 rounded-full bg-brand-700" />}
                  <span className="truncate text-xs font-semibold text-foreground">{item.title}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {timeLabel(item.createdAt)}
                  </span>
                </span>
                {item.body && (
                  <span className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                    {item.body}
                  </span>
                )}
              </button>
            ))}
          </div>

          <PushRow
            title={push.title}
            hintOn={push.hintOn}
            hintOff={push.hintOff}
            denied={push.denied}
            unsupported={push.unsupported}
            turnOn={push.turnOn}
            turnOff={push.turnOff}
            test={push.test}
            testOk={push.testOk}
            testFail={push.testFail}
          />
        </div>
      )}

      {toasts.length > 0 && (
        <div className="fixed right-3 bottom-3 z-[70] flex w-[min(21rem,calc(100vw-1.5rem))] flex-col gap-2">
          {toasts.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={async () => {
                if (!item.readAt) await markRead(item.id);
                setToasts((prev) => prev.filter((entry) => entry.id !== item.id));
                router.push(item.href);
              }}
              className="flex w-full items-start gap-2.5 rounded-xl border border-brand-200 bg-background px-3 py-2.5 text-left shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-800">
                <Bell className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[12px] font-semibold text-foreground">{item.title}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {timeLabel(item.createdAt)}
                  </span>
                </span>
                {item.body && (
                  <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-muted-foreground">
                    {item.body}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
