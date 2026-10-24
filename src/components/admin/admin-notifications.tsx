"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string;
  readAt: string | null;
  createdAt: string;
};

type Props = {
  initialUnread: number;
  title: string;
  empty: string;
  markAll: string;
};

function timeLabel(value: string): string {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminNotifications({ initialUnread, title, empty, markAll }: Props) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store" });
      const data = (await response.json()) as { counts?: { total: number }; items?: Item[] };
      setUnread(data.counts?.total ?? 0);
      setItems(data.items ?? []);
    } catch {
      // tarmoq xatosi — keyingi urinishda qayta olinadi
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const response = await fetch("/api/admin/notifications", { cache: "no-store" });
        const data = (await response.json()) as { counts?: { total: number } };
        if (typeof data.counts?.total === "number") setUnread(data.counts.total);
      } catch {
        // jim
      }
    }, 30_000);

    return () => clearInterval(timer);
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
    await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    }).catch(() => null);

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
        className="relative flex size-9 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-accent"
        aria-label={title}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
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
                <Loader2 className="size-3.5 animate-spin" />
                …
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
                  router.refresh();
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
        </div>
      )}
    </div>
  );
}
