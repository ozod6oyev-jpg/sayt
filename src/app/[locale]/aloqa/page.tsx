import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  HeadphonesIcon,
  InstagramIcon,
  MapPinIcon,
  PhoneIcon,
  TelegramIcon,
} from "@/components/icons";
import { contact } from "@/lib/contact";
import { getDict, isLocale, siteName } from "@/lib/i18n";
import { alternatesFor, robotsMeta, socialMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  const title = t.nav.contact;

  return {
    title,
    description: t.footer.about,
    alternates: alternatesFor(locale, "/aloqa"),
    robots: robotsMeta,
    ...socialMetadata({ title, description: t.footer.about, path: `/${locale}/aloqa`, locale }),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  return (
    <div>
      <section className="bg-brand-900 py-10 text-white sm:py-12">
        <div className="container-page max-w-3xl">
          <p className="text-xs font-bold tracking-[0.18em] text-brand-200 uppercase">
            {siteName}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t.nav.contact}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-100/80">{t.footer.about}</p>
        </div>
      </section>

      <div className="container-page mt-8 grid max-w-3xl gap-4 pb-4 sm:grid-cols-2">
        <div className="card p-5 sm:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <PhoneIcon className="h-4 w-4" />
            </span>
            Telefon
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-900">{contact.name}</p>
          <a
            href={contact.phoneHref}
            className="mt-1 block text-lg font-semibold text-brand-700 hover:underline"
          >
            {contact.phoneDisplay}
          </a>
          <p className="mt-1 text-xs text-slate-500">{contact.hours[locale]}</p>
        </div>

        <div className="card p-5 sm:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#229ED9]/10 text-[#229ED9]">
              <TelegramIcon className="h-4 w-4" />
            </span>
            Telegram
          </h2>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={contact.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lg font-semibold text-brand-700 hover:underline"
            >
              <TelegramIcon className="h-6 w-6 text-[#229ED9]" />
              {contact.telegramHandle}
            </a>
            <a
              href={contact.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <HeadphonesIcon className="h-4 w-4" />
              {locale === "ru" ? "Связаться" : "Bog'lanish"}
            </a>
          </div>
        </div>

        <div className="card p-5 sm:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <InstagramIcon className="h-4 w-4" />
            </span>
            {locale === "ru" ? "Наши соцсети" : "Ijtimoiy tarmoqlarimiz"}
          </h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-8">
            <a
              href={contact.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-brand-700"
            >
              <InstagramIcon className="h-5 w-5 text-[#E1306C]" />
              {contact.instagramHandle}
            </a>
            <a
              href={contact.telegramChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-brand-700"
            >
              <TelegramIcon className="h-5 w-5 text-[#229ED9]" />
              {contact.telegramChannelHandle}
            </a>
          </div>
        </div>

        <div className="card p-5 sm:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <MapPinIcon className="h-4 w-4" />
            </span>
            {locale === "ru" ? "Адрес" : "Manzil"}
          </h2>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-brand-700"
            >
              <MapPinIcon className="h-4 w-4 text-brand-500" />
              {contact.address[locale]}
            </a>
            <a
              href={contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs"
            >
              {locale === "ru" ? "Открыть на карте" : "Xaritada ochish"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
