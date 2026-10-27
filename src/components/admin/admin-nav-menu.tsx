"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Newspaper,
  House,
  Tags,
  UserRound,
  Users,
} from "lucide-react";
import { MetaLogo } from "@/components/meta-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ADMIN_COUNTS_EVENT, type AdminCounts } from "@/lib/admin-events";
import { cn } from "@/lib/utils";

export type AdminNavLink = { href: string; label: string; logo?: "meta" };
export type AdminNavGroup = { label?: string; links: AdminNavLink[] };

function iconFor(href: string) {
  if (href === "/admin") return LayoutDashboard;
  if (href.startsWith("/admin/reklama")) return Megaphone;
  if (href.startsWith("/admin/listings")) return House;
  if (href.startsWith("/admin/sotuv-variantlari")) return Tags;
  if (href.startsWith("/admin/articles")) return Newspaper;
  if (href.startsWith("/admin/leads")) return MessageSquare;
  if (href.startsWith("/admin/meta")) return MessageSquare;
  if (href.startsWith("/admin/users")) return Users;
  if (href.startsWith("/admin/kirish-huquqi")) return KeyRound;
  if (href.startsWith("/admin/profil")) return UserRound;
  return LayoutGrid;
}

export function AdminNavMenu({
  groups,
  label,
  badges = {},
}: {
  groups: AdminNavGroup[];
  label: string;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname() || "/admin";
  const [liveBadges, setLiveBadges] = useState(badges);

  useEffect(() => {
    setLiveBadges(badges);
  }, [badges]);

  useEffect(() => {
    function onCounts(event: Event) {
      const counts = (event as CustomEvent<AdminCounts>).detail;
      if (!counts) return;
      const unread = counts.meta + counts.telegram;
      setLiveBadges({
        "/admin/leads": counts.lead,
        "/admin/meta": unread,
        "/admin/meta/xabarlar": unread,
      });
    }

    window.addEventListener(ADMIN_COUNTS_EVENT, onCounts);
    return () => window.removeEventListener(ADMIN_COUNTS_EVENT, onCounts);
  }, []);
  const links = groups.flatMap((group) => group.links);

  // Eng uzun mos yo'l — joriy bo'lim (masalan /admin/users/123 → Adminlar)
  const current = [...links]
    .sort((a, b) => b.href.length - a.href.length)
    .find((link) =>
      link.href === "/admin"
        ? pathname === "/admin"
        : pathname === link.href || pathname.startsWith(`${link.href}/`),
    );

  const CurrentIcon = current
    ? current.logo === "meta"
      ? null
      : iconFor(current.href)
    : LayoutGrid;
  const totalUnread = Object.values(liveBadges).reduce((sum, value) => sum + value, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-8 max-w-[10rem] items-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40"
          aria-label={label}
        >
          {current?.logo === "meta" ? (
            <MetaLogo className="size-4 shrink-0" />
          ) : (
            CurrentIcon && <CurrentIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{current?.label ?? label}</span>
          {(liveBadges[current?.href ?? ""] ?? 0) === 0 && totalUnread > 0 ? (
            <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          ) : null}
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="max-h-[min(70vh,32rem)] w-64 overflow-y-auto p-1.5"
      >
        {groups.map((group, groupIndex) => (
          <div key={group.label ?? `group-${groupIndex}`}>
            {group.label && (
              <p className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </p>
            )}

            {group.links.map((link) => {
              const active = current?.href === link.href;
              const Icon = iconFor(link.href);

              return (
                <DropdownMenuItem asChild key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group/item",
                      active ? "bg-accent font-semibold text-foreground" : "text-foreground/75",
                    )}
                  >
                    {link.logo === "meta" ? (
                      <MetaLogo className="size-4 shrink-0" />
                    ) : (
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-brand-700" : "text-muted-foreground",
                        )}
                      />
                    )}
                    <span className="truncate">{link.label}</span>
                    {(liveBadges[link.href] ?? 0) > 0 && (
                      <span className="ml-auto flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
                        {(liveBadges[link.href] ?? 0) > 99 ? "99+" : liveBadges[link.href]}
                      </span>
                    )}
                    {active && (
                      <span className="ml-auto size-1.5 shrink-0 rounded-full bg-brand-700" />
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
