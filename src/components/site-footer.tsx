import Image from "next/image";
import Link from "next/link";
import { contact } from "@/lib/contact";
import { getDict, localePath, siteName, type Locale } from "@/lib/i18n";
import { HeadphonesIcon, InstagramIcon, TelegramIcon } from "./icons";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-mark.png"
              alt={siteName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-base font-bold text-slate-900">{siteName}</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">{t.footer.about}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t.footer.navigation}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link href={localePath(locale, "/elonlar")} className="hover:text-brand-700">
                {t.nav.listings}
              </Link>
            </li>
            <li>
              <Link href={localePath(locale, "/blog")} className="hover:text-brand-700">
                {t.nav.blog}
              </Link>
            </li>
            <li>
              <Link href={localePath(locale, "/aloqa")} className="hover:text-brand-700">
                {t.nav.contact}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t.footer.contact}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="font-medium text-slate-900">{contact.name}</li>
            <li>
              <a href={contact.phoneHref} className="font-semibold text-brand-700 hover:underline">
                {contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="hover:text-brand-700">
                {contact.email}
              </a>
            </li>
            <li>
              <a
                href={contact.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-brand-700"
              >
                <TelegramIcon className="h-4 w-4 text-[#229ED9]" />
                {contact.telegramHandle}
              </a>
            </li>
            <li>{contact.address[locale]}</li>
          </ul>

          <a
            href={contact.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-4 w-full text-xs"
          >
            <HeadphonesIcon className="h-4 w-4" />
            {locale === "ru" ? "Связаться" : "Bog'lanish"}
          </a>

          <p className="mt-5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            {locale === "ru" ? "Наши соцсети" : "Ijtimoiy tarmoqlarimiz"}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            <li>
              <a
                href={contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-brand-700"
              >
                <InstagramIcon className="h-4 w-4 text-[#E1306C]" />
                {contact.instagramHandle}
              </a>
            </li>
            <li>
              <a
                href={contact.telegramChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-brand-700"
              >
                <TelegramIcon className="h-4 w-4 text-[#229ED9]" />
                {contact.telegramChannelHandle}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteName}. {t.footer.rights}
          </p>
          <div className="flex gap-4">
            <Link href={localePath(locale, "/maxfiylik")} className="hover:text-slate-700">
              {t.footer.privacy}
            </Link>
            <Link href="/admin" className="hover:text-slate-700">
              {t.nav.admin}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
