"use client";

import { useState } from "react";
import type { SocialMediaItem } from "@/lib/meta-overview";

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} mln`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")} ming`;
  return String(value);
}

/** Profil postlari: boshida bir nechtasi, «Ko'proq» bilan hammasi ochiladi */
export function ProfilePostsGrid({
  items,
  moreLabel,
  lessLabel,
  initial = 6,
}: {
  items: SocialMediaItem[];
  moreLabel: string;
  lessLabel: string;
  initial?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, initial);
  const hidden = Math.max(items.length - initial, 0);

  return (
    <div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {visible.map((item) => (
          <a
            key={item.id}
            href={item.permalink ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="relative block overflow-hidden rounded-lg bg-slate-100"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="grid aspect-square place-items-center text-[10px] text-slate-400">
                {item.mediaType}
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[10px] text-white">
              ♥ {item.likes ?? 0} · 💬 {item.comments ?? 0}
              {item.views !== null && <> · 👁 {compact(item.views)}</>}
            </span>
          </a>
        ))}
      </div>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="btn-secondary mt-2 w-full text-xs"
        >
          {expanded ? lessLabel : `${moreLabel} (${hidden})`}
        </button>
      )}
    </div>
  );
}
