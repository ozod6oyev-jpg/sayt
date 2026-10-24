"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({
  links,
  homeHref,
}: {
  links: { href: string; label: string }[];
  homeHref: string;
}) {
  const pathname = usePathname() || homeHref;

  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Asosiy menyu">
      {links.map((link) => {
        const active =
          link.href === homeHref ? pathname === homeHref : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
