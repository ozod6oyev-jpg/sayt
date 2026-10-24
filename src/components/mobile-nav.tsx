"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock, Menu, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { contact } from "@/lib/contact";
import { getDict, localePath, siteName, type Locale } from "@/lib/i18n";
import { InstagramIcon, TelegramIcon } from "./icons";

export function MobileNav({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  const links = [
    { href: localePath(locale), label: t.nav.home },
    { href: localePath(locale, "/elonlar"), label: t.nav.listings },
    { href: localePath(locale, "/blog"), label: t.nav.blog },
    { href: localePath(locale, "/aloqa"), label: t.nav.contact },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label={locale === "ru" ? "Открыть меню" : "Menyuni ochish"}
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="sr-only">{siteName}</SheetTitle>
          <Link href={localePath(locale)} className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt={siteName}
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-foreground">{siteName}</span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {locale === "ru" ? "Недвижимость в Узбекистане" : "O'zbekistonda ko'chmas mulk"}
              </span>
            </span>
          </Link>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-0.5">
            {links.map((link) => (
              <li key={link.href}>
                <SheetClose asChild>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {link.label}
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-xl bg-secondary/60 p-3">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {locale === "ru" ? "Связаться" : "Bog'lanish"}
            </p>
            <div className="mt-2 space-y-1">
              <a
                href={contact.phoneHref}
                className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm font-semibold text-foreground"
              >
                <Phone className="size-4 text-primary" />
                {contact.phoneDisplay}
              </a>
              <a
                href={contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-foreground/80"
              >
                <MapPin className="size-4 text-primary" />
                {contact.address[locale]}
              </a>
              <p className="flex items-center gap-2.5 px-1 py-1.5 text-xs text-muted-foreground">
                <Clock className="size-4 text-primary" />
                {contact.hours[locale]}
              </p>
            </div>

            <div className="mt-3 flex gap-2">
              <a
                href={contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-card px-2 py-2 text-xs font-semibold text-foreground shadow-xs"
              >
                <InstagramIcon className="h-3.5 w-3.5" />
                {contact.instagramHandle}
              </a>
              <a
                href={contact.telegramChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-card px-2 py-2 text-xs font-semibold text-foreground shadow-xs"
              >
                <TelegramIcon className="h-3.5 w-3.5" />
                {contact.telegramChannelHandle}
              </a>
            </div>
          </div>
        </nav>

        <div className="border-t border-border p-4">
          <SheetClose asChild>
            <Button asChild size="lg" className="w-full">
              <Link href={localePath(locale, "/elonlar")}>{t.nav.listings}</Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
