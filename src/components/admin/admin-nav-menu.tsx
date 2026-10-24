"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
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
import { cn } from "@/lib/utils";

export type AdminNavLink = { href: string; label: string; logo?: "meta" };
export type AdminNavGroup = { label?: string; links: AdminNavLink[] };

function iconFor(href: string) {
  if (href === "/admin") return LayoutDashboard;
  if (href.startsWith("/admin/listings")) return House;
  if (href.startsWith("/admin/sotuv-variantlari")) return Tags;
  if (href.startsWith("/admin/articles")) return Newspaper;
  if (href.startsWith("/admin/leads")) return MessageSquare;
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
  const links = groups.flatMap((group) => group.links);

  // Eng uzun mos yo'l — joriy bo'lim (masalan /admin/users/123 → Adminlar)
  const current =
    [...links]
      .sort((a, b) => b.href.length - a.href.length)
      .find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`)) ?? links[0];

  const CurrentIcon = current?.logo === "meta" ? null : iconFor(current?.href ?? "/admin");
  const totalUnread = Object.values(badges).reduce((sum, value) => sum + value, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:px-3 sm:py-2 sm:text-sm"
          aria-label={label}
        >
          {current?.logo === "meta" ? (
            <MetaLogo className="size-4 shrink-0" />
          ) : (
            CurrentIcon && <CurrentIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="max-w-[7.5rem] truncate sm:max-w-[12rem]">{current?.label ?? label}</span>
          {(badges[current?.href ?? ""] ?? 0) === 0 && totalUnread > 0 ? (
            <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          ) : null}
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
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
                    {(badges[link.href] ?? 0) > 0 && (
                      <span className="ml-auto flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
                        {(badges[link.href] ?? 0) > 99 ? "99+" : badges[link.href]}
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
