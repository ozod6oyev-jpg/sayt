"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { InboxAvatar } from "./avatar";
import type { InboxChatItem } from "@/lib/inbox-types";
import { cn } from "@/lib/utils";

export type InboxItem = InboxChatItem;

export function InboxChatList({
  items,
  selectedId,
  filterQuery,
  copy,
  onSelect,
}: {
  items: InboxItem[];
  selectedId?: string;
  filterQuery: string;
  copy: { title: string; search: string; empty: string; noResults: string; you: string };
  onSelect?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((item) =>
      `${item.title} ${item.subtitle}`.toLowerCase().includes(needle),
    );
  }, [items, query]);

  return (
    <>
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{copy.title}</p>
          <span className="text-[11px] text-muted-foreground">{items.length}</span>
        </div>

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
            className="w-full rounded-lg border border-border bg-background py-1.5 pr-2.5 pl-8 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-700"
          />
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {items.length === 0 && (
          <div className="px-4 py-10 text-center">
            <Users className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-xs text-muted-foreground">{copy.empty}</p>
          </div>
        )}

        {items.length > 0 && visible.length === 0 && (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">{copy.noResults}</p>
        )}

        {visible.map((chat) => {
          const active = selectedId === chat.id;

          return (
            <Link
              key={chat.key}
              href={`?chat=${chat.id}${filterQuery}`}
              onClick={
                onSelect
                  ? (event) => {
                      event.preventDefault();
                      onSelect(chat.id);
                    }
                  : undefined
              }
              className={cn(
                "flex items-start gap-2.5 border-b border-border/60 px-3 py-2.5 last:border-0 hover:bg-accent",
                active && "bg-accent",
              )}
            >
              <InboxAvatar name={chat.title} src={chat.avatar} size="lg" className="mt-0.5" />

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-semibold text-foreground">
                    {chat.title}
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {chat.time}
                  </span>
                </span>

                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className="truncate text-[11px] text-muted-foreground">
                    {chat.lastOut ? `${copy.you}: ` : ""}
                    {chat.lastText}
                  </span>
                  {chat.unread > 0 && (
                    <span className="ml-auto shrink-0 rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-4 text-white">
                      {chat.unread > 99 ? "99+" : chat.unread}
                    </span>
                  )}
                </span>

                <span className="mt-1 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] font-medium",
                      chat.platform === "Telegram"
                        ? "bg-[#229ED9]/10 text-[#1b7fb0]"
                        : "bg-brand-50 text-brand-800",
                    )}
                  >
                    {chat.platform}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">{chat.subtitle}</span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
