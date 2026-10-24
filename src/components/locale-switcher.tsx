"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, otherLocale, type Locale } from "@/lib/i18n";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const target = otherLocale(locale);
  const rest = pathname.replace(new RegExp(`^/(uz|ru)`), "");
  const href = `/${target}${rest}`;

  return (
    <Link
      href={href}
      hrefLang={target}
      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
      title={localeNames[target]}
      aria-label={localeNames[target]}
    >
      {target.toUpperCase()}
    </Link>
  );
}
