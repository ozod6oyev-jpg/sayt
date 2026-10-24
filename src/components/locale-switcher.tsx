"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { localeNames, otherLocale, type Locale } from "@/lib/i18n";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const target = otherLocale(locale);
  const rest = pathname.replace(new RegExp(`^/(uz|ru)`), "");
  const href = `/${target}${rest}`;

  return (
    <Button asChild variant="outline" size="sm" className="h-9 px-2.5">
      <Link
        href={href}
        hrefLang={target}
        title={localeNames[target]}
        aria-label={localeNames[target]}
      >
        {target.toUpperCase()}
      </Link>
    </Button>
  );
}
