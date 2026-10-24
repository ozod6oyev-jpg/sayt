"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { MetaLogo } from "@/components/meta-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; logo?: "meta" };

export function AdminNavMenu({ links, label }: { links: NavLink[]; label: string }) {
  const pathname = usePathname() || "/admin";

  // Eng uzun mos yo'l — joriy bo'lim (masalan /admin/users/123 → Adminlar)
  const current =
    [...links]
      .sort((a, b) => b.href.length - a.href.length)
      .find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`)) ?? links[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:px-3 sm:py-2 sm:text-sm"
          aria-label={label}
        >
          <LayoutGrid className="size-4 shrink-0 text-muted-foreground" />
          <span className="max-w-[7.5rem] truncate sm:max-w-[12rem]">{current?.label ?? label}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>

        {links.map((link) => {
          const active = current?.href === link.href;

          return (
            <DropdownMenuItem asChild key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(active && "bg-accent font-semibold text-foreground")}
              >
                {link.logo === "meta" && <MetaLogo className="size-4 shrink-0" />}
                {link.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
