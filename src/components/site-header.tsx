import Image from "next/image";
import Link from "next/link";
import { getDict, localePath, siteName, type Locale } from "@/lib/i18n";
import { LocaleSwitcher } from "./locale-switcher";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  const links = [
    { href: localePath(locale), label: t.nav.home },
    { href: localePath(locale, "/elonlar"), label: t.nav.listings },
    { href: localePath(locale, "/blog"), label: t.nav.blog },
    { href: localePath(locale, "/aloqa"), label: t.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href={localePath(locale)} className="flex items-center gap-2">
          <Image
            src="/logo-mark.png"
            alt={siteName}
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-lg object-cover"
          />
          <span className="hidden text-sm font-bold tracking-tight text-slate-900 sm:inline">
            {siteName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Asosiy menyu">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} />
          <Link href={localePath(locale, "/elonlar")} className="btn-primary hidden sm:inline-flex">
            {t.nav.listings}
          </Link>
        </div>
      </div>

      <nav className="border-t border-slate-100 md:hidden" aria-label="Mobil menyu">
        <div className="container-page flex gap-1 overflow-x-auto py-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
