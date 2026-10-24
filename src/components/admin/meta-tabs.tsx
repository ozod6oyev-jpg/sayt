"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MetaTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname() || "/admin/meta";

  return (
    <nav
      aria-label="Meta bo'limlari"
      className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
    >
      {tabs.map((tab) => {
        const active =
          tab.href === "/admin/meta" ? pathname === tab.href : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-accent font-semibold text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
