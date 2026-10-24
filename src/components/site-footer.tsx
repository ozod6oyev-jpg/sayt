import Link from "next/link";
import { getDict, localePath, type Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              U
            </span>
            <span className="text-lg font-bold text-slate-900">UyJoy</span>
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
            <li>
              <a href="tel:+998901234567" className="hover:text-brand-700">
                +998 90 123 45 67
              </a>
            </li>
            <li>
              <a href="mailto:info@uyjoy.uz" className="hover:text-brand-700">
                info@uyjoy.uz
              </a>
            </li>
            <li>Toshkent, O'zbekiston</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} UyJoy. {t.footer.rights}
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
