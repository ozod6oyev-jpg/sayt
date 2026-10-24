import Image from "next/image";
import Link from "next/link";
import { contact } from "@/lib/contact";
import { getDict, localePath, siteName, type Locale } from "@/lib/i18n";
import { MapPinIcon, PhoneIcon, TelegramIcon } from "./icons";
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
    <>
      <div className="hidden bg-brand-900 text-brand-100 sm:block">
        <div className="container-page flex h-10 items-center justify-between gap-4 text-xs">
          <p className="flex items-center gap-2">
            <MapPinIcon className="h-3.5 w-3.5 text-brand-300" />
            <span>{contact.address[locale]}</span>
            <span className="text-brand-400">·</span>
            <span>{contact.hours[locale]}</span>
          </p>

          <div className="flex items-center gap-5">
            <a
              href={contact.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <TelegramIcon className="h-3.5 w-3.5" />
              {contact.telegramHandle}
            </a>
            <a
              href={contact.phoneHref}
              className="inline-flex items-center gap-1.5 font-semibold text-white transition-colors hover:text-brand-200"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              {contact.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
          <Link href={localePath(locale)} className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt={siteName}
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-xl object-cover shadow-sm"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                {siteName}
              </span>
              <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
                {locale === "ru" ? "Недвижимость в Узбекистане" : "O'zbekistonda ko'chmas mulk"}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Asosiy menyu">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={contact.phoneHref}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 sm:hidden"
              aria-label={contact.phoneDisplay}
            >
              <PhoneIcon className="h-4 w-4" />
            </a>
            <LocaleSwitcher locale={locale} />
            <Link href={localePath(locale, "/elonlar")} className="btn-primary hidden text-xs sm:inline-flex">
              {t.nav.listings}
            </Link>
          </div>
        </div>

        <nav className="border-t border-slate-100 lg:hidden" aria-label="Mobil menyu">
          <div className="container-page flex gap-1 overflow-x-auto py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
