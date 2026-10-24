import Image from "next/image";
import Link from "next/link";
import { BrandRotator } from "./brand-rotator";
import { MapPinIcon, PhoneIcon, TelegramIcon } from "./icons";
import { NotificationBell } from "./notification-bell";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { contact } from "@/lib/contact";
import { getDict, localePath, siteName, type Locale } from "@/lib/i18n";

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
      <div className="hidden bg-brand-900 text-white/75 sm:block">
        <div className="container-page flex h-10 items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <a
              href={contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <MapPinIcon className="h-3.5 w-3.5 text-white/50" />
              {contact.address[locale]}
            </a>
            <span className="hidden text-white/35 md:inline">·</span>
            <span className="hidden text-white/60 md:inline">{contact.hours[locale]}</span>
          </div>

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
              className="inline-flex items-center gap-1.5 font-semibold text-white transition-colors hover:text-white/80"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              {contact.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <header className="site-header sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-xl">
        <div className="container-page relative flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
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
              <span className="text-sm font-extrabold tracking-tight text-foreground sm:text-base">
                <BrandRotator locale={locale} />
              </span>
              <span className="hidden text-[11px] font-medium text-muted-foreground sm:block">
                {locale === "ru" ? "Недвижимость в Ташкенте" : "Toshkentda ko'chmas mulk"}
              </span>
            </span>
          </Link>

          <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 lg:block">
            <div className="pointer-events-auto flex h-full items-center">
              <NavLinks links={links} homeHref={localePath(locale)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell locale={locale} />
            <ThemeToggle label={locale === "ru" ? "Тёмная тема" : "Tungi rejim"} />
            <LocaleSwitcher locale={locale} />

            <Button asChild className="hidden sm:inline-flex">
              <Link href={localePath(locale, "/elonlar")}>{t.nav.listings}</Link>
            </Button>

            <MobileNav locale={locale} />
          </div>
        </div>
      </header>
    </>
  );
}
