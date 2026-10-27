"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, BellRing, Check, X } from "lucide-react";
import {
  disablePush,
  ensurePush,
  hasLocalSubscription,
  pushState,
  resetPush,
  type PushState,
} from "@/lib/push-browser";
import { localePath, type Locale } from "@/lib/i18n";

type ListingItem = {
  id: string;
  title: string;
  price: string;
  district: string;
  date: string;
  image: string | null;
  href: string;
  createdAt: string;
};

type ArticleItem = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  href: string;
  createdAt: string;
};

type Payload = { listings: ListingItem[]; articles: ArticleItem[] };

const SEEN_KEY = "uyjoy-notifications-seen";
const POLL_MS = 60_000;

const COPY = {
  uz: {
    open: "Bildirishnomalar",
    title: "Bildirishnomalar",
    close: "Yopish",
    listings: "So'nggi e'lonlar",
    articles: "So'nggi maqolalar",
    empty: "Hozircha yangilik yo'q.",
    newBadge: "Yangi",
    hint: "Yangi e'lon va maqolalar haqida birinchi bo'lib biling.",
    enable: "Bildirishnomalarni yoqish",
    enabled: "Bildirishnomalar yoqilgan",
    disable: "O'chirish",
    denied: "Brauzerda bildirishnomalar bloklangan. Sayt sozlamalaridan ruxsat bering.",
    unsupported: "Bu brauzer bildirishnomalarni qo'llamaydi.",
    allListings: "Barcha e'lonlar",
    allArticles: "Barcha maqolalar",
    newListing: "Yangi e'lon",
    newArticle: "Yangi maqola",
  },
  ru: {
    open: "Уведомления",
    title: "Уведомления",
    close: "Закрыть",
    listings: "Последние объявления",
    articles: "Последние статьи",
    empty: "Пока нет новостей.",
    newBadge: "Новое",
    hint: "Узнавайте первыми о новых объявлениях и статьях.",
    enable: "Включить уведомления",
    enabled: "Уведомления включены",
    disable: "Отключить",
    denied: "Уведомления заблокированы в браузере. Разрешите их в настройках сайта.",
    unsupported: "Этот браузер не поддерживает уведомления.",
    allListings: "Все объявления",
    allArticles: "Все статьи",
    newListing: "Новое объявление",
    newArticle: "Новая статья",
  },
};

export function NotificationBell({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Payload>({ listings: [], articles: [] });
  const [unread, setUnread] = useState(0);
  const [push, setPush] = useState<PushState>("off");
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const seenInitialized = useRef(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications?locale=${locale}`, { cache: "no-store" });
      if (!response.ok) return;
      const next = (await response.json()) as Payload;
      setData(next);

      const all = [...next.listings, ...next.articles].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      );
      const seen = window.localStorage.getItem(SEEN_KEY);
      if (!seenInitialized.current) {
        setSeenAt(seen);
        seenInitialized.current = true;
      }
      setUnread(seen ? all.filter((item) => item.createdAt > seen).length : 0);

    } catch {
      // tarmoq xatosi — keyingi urinishda qayta yuklanadi
    }
  }, [locale]);

  useEffect(() => {
    void (async () => {
      let next = await pushState("site");

      // Brauzerda obuna bor, serverda yozuv yo'q bo'lsa — qayta ro'yxatdan o'tkazamiz
      if (next === "off" && typeof Notification !== "undefined" && Notification.permission === "granted") {
        next = await ensurePush("site");
      }

      setPush(next);
    })();

    void load();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;

    const onClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);

    if (next) {
      void load();
      window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
      window.setTimeout(() => setUnread(0), 900);
    }
  }

  async function enable() {
    setPush("working");
    setPush(await resetPush("site"));
  }

  async function disable() {
    setPush("working");
    setPush(await disablePush("site"));
  }

  const isNew = (createdAt: string) => Boolean(seenAt && createdAt > seenAt);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={copy.open}
        aria-expanded={open}
        title={copy.open}
        className="relative inline-flex size-9 items-center justify-center rounded-xl border border-input bg-background text-foreground transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <BellRing className="bell-ring size-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] leading-4 font-bold text-white shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-in fade-in slide-in-from-top-1 fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-float duration-200 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[23rem]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-foreground">{copy.title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={copy.close}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {push !== "on" && (
              <div className="border-b border-border bg-muted/50 px-4 py-3">
                {push === "unsupported" || push === "denied" || push === "working" ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    {push === "denied" ? copy.denied : push === "working" ? copy.enable : copy.unsupported}
                  </p>
                ) : (
                  <>
                    <p className="text-xs leading-5 text-muted-foreground">{copy.hint}</p>
                    <button
                      type="button"
                      onClick={enable}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      <Bell className="size-3.5" />
                      {copy.enable}
                    </button>
                  </>
                )}
              </div>
            )}

            {push === "on" && (
              <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-2 text-[11px] font-medium text-emerald-600">
                <span className="flex items-center gap-1.5">
                  <Check className="size-3.5" />
                  {copy.enabled}
                </span>
                <button
                  type="button"
                  onClick={() => void disable()}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  {copy.disable}
                </button>
              </div>
            )}

            <div className="px-4 py-3">
              <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                {copy.listings}
              </p>
              <div className="mt-2 space-y-1">
                {data.listings.length === 0 && (
                  <p className="py-2 text-xs text-muted-foreground">{copy.empty}</p>
                )}
                {data.listings.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
                  >
                    <span className="relative block size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt=""
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-xs leading-5 font-semibold text-foreground">
                        {item.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-brand-700">{item.price}</span>
                        <span>·</span>
                        <span className="truncate">{item.district}</span>
                      </span>
                    </span>
                    {isNew(item.createdAt) && (
                      <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                        {copy.newBadge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-border px-4 py-3">
              <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                {copy.articles}
              </p>
              <div className="mt-2 space-y-1">
                {data.articles.length === 0 && (
                  <p className="py-2 text-xs text-muted-foreground">{copy.empty}</p>
                )}
                {data.articles.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
                  >
                    <span className="relative block size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={item.image}
                        alt=""
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-xs leading-5 font-semibold text-foreground">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {item.date}
                      </span>
                    </span>
                    {isNew(item.createdAt) && (
                      <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                        {copy.newBadge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2.5 text-[11px] font-semibold">
            <Link
              href={localePath(locale, "/elonlar")}
              onClick={() => setOpen(false)}
              className="text-brand-700 hover:underline"
            >
              {copy.allListings} →
            </Link>
            <Link
              href={localePath(locale, "/blog")}
              onClick={() => setOpen(false)}
              className="text-brand-700 hover:underline"
            >
              {copy.allArticles} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
