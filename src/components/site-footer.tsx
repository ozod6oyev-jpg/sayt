import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { contact } from "@/lib/contact";
import { getDict, localePath, siteName, type Locale } from "@/lib/i18n";
import { HeadphonesIcon, InstagramIcon, MapPinIcon, PhoneIcon, TelegramIcon } from "./icons";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-brand-900 text-brand-100">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt={siteName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-cover"
            />
            <span className="text-lg font-bold text-white">{siteName}</span>
          </div>

          <p className="mt-4 max-w-md text-sm leading-7 text-brand-100/80">{t.footer.about}</p>

          <p className="mt-6 text-[11px] font-semibold tracking-wide text-brand-200 uppercase">
            {locale === "ru" ? "Наши соцсети" : "Ijtimoiy tarmoqlarimiz"}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button asChild variant="subtle" size="sm" className="h-9 gap-2 rounded-xl px-3">
              <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer">
                <InstagramIcon className="h-4 w-4" />
                {contact.instagramHandle}
              </a>
            </Button>
            <Button asChild variant="subtle" size="sm" className="h-9 gap-2 rounded-xl px-3">
              <a href={contact.telegramChannelUrl} target="_blank" rel="noopener noreferrer">
                <TelegramIcon className="h-4 w-4" />
                {contact.telegramChannelHandle}
              </a>
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-semibold tracking-wide text-brand-200 uppercase">
            {t.footer.navigation}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href={localePath(locale, "/elonlar")} className="transition-colors hover:text-white">
                {t.nav.listings}
              </Link>
            </li>
            <li>
              <Link href={localePath(locale, "/blog")} className="transition-colors hover:text-white">
                {t.nav.blog}
              </Link>
            </li>
            <li>
              <Link href={localePath(locale, "/aloqa")} className="transition-colors hover:text-white">
                {t.nav.contact}
              </Link>
            </li>
            <li>
              <Link href={localePath(locale, "/maxfiylik")} className="transition-colors hover:text-white">
                {t.footer.privacy}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-[11px] font-semibold tracking-wide text-brand-200 uppercase">
            {t.footer.contact}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li className="font-semibold text-white">{contact.name}</li>
            <li>
              <a
                href={contact.phoneHref}
                className="inline-flex items-center gap-2 font-semibold text-white transition-colors hover:text-brand-200"
              >
                <PhoneIcon className="h-4 w-4 text-brand-300" />
                {contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-white"
              >
                <MapPinIcon className="h-4 w-4 text-brand-300" />
                {contact.address[locale]}
              </a>
            </li>
            <li className="text-brand-100/70">{contact.hours[locale]}</li>
          </ul>

          <Button
            asChild
            variant="secondary"
            className="mt-5 bg-white text-brand-900 shadow-sm hover:bg-brand-50"
          >
            <a href={contact.telegramUrl} target="_blank" rel="noopener noreferrer">
              <HeadphonesIcon className="h-4 w-4" />
              {locale === "ru" ? "Связаться" : "Bog'lanish"}
            </a>
          </Button>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-brand-100/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteName}. {t.footer.rights}
          </p>
          <div className="flex gap-4">
            <Link href={localePath(locale, "/maxfiylik")} className="hover:text-white">
              {t.footer.privacy}
            </Link>
            <Link href="/admin" className="hover:text-white">
              {t.nav.admin}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
