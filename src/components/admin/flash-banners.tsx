"use client";

import { useEffect, useState } from "react";

export type FlashTone = "ok" | "error";

/** URL'dagi holat parametrlari — bildirishnoma ko'rsatilgach manzildan olib tashlanadi */
const FLASH_PARAMS = ["ads", "account", "adsCheck", "ad", "holat"];

/**
 * Server'dan kelgan qisqa bildirishnomalar: ~2 sekunddan keyin silliq yopiladi
 * va URL tozalanadi, shunda sahifa yangilanganda qayta chiqmaydi.
 */
export function FlashBanners({ items }: { items: { tone: FlashTone; text: string }[] }) {
  const [visible, setVisible] = useState(true);
  const [gone, setGone] = useState(false);
  const signature = items.map((item) => `${item.tone}:${item.text}`).join("|");

  useEffect(() => {
    if (!signature) return;

    const url = new URL(window.location.href);
    let changed = false;
    for (const key of FLASH_PARAMS) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      const search = url.searchParams.toString();
      window.history.replaceState(null, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
    }

    setVisible(true);
    setGone(false);

    const fade = window.setTimeout(() => setVisible(false), 1700);
    const remove = window.setTimeout(() => setGone(true), 2000);

    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(remove);
    };
  }, [signature]);

  if (!signature || gone) return null;

  return (
    <div aria-live="polite" className="space-y-2">
      {items.map((banner) => (
        <p
          key={`${banner.tone}:${banner.text}`}
          className={`${
            banner.tone === "ok"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
          } rounded-lg px-4 py-3 text-sm transition-all duration-300 ease-out ${
            visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
          }`}
        >
          {banner.text}
        </p>
      ))}
    </div>
  );
}
