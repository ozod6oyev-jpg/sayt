import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeadphonesIcon, InstagramIcon, TelegramIcon } from "@/components/icons";
import { contact } from "@/lib/contact";
import { getDict, isLocale } from "@/lib/i18n";
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
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold">{t.nav.contact}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">{t.footer.about}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">Telefon</h2>
          <p className="mt-2 text-sm font-medium text-slate-900">{contact.name}</p>
          <a
            href={contact.phoneHref}
            className="mt-1 block text-lg font-semibold text-brand-700 hover:underline"
          >
            {contact.phoneDisplay}
          </a>
          <p className="mt-1 text-xs text-slate-500">{contact.hours[locale]}</p>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">Email</h2>
          <a
            href={`mailto:${contact.email}`}
            className="mt-2 block text-lg font-semibold text-brand-700 hover:underline"
          >
            {contact.email}
          </a>
          <p className="mt-1 text-xs text-slate-500">
            {locale === "ru" ? "Ответим в течение рабочего дня" : "Ish kuni ichida javob beramiz"}
          </p>
        </div>

        <div className="card p-5 sm:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Telegram</h2>
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
          <h2 className="text-sm font-semibold text-slate-900">
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
          <h2 className="text-sm font-semibold text-slate-900">
            {locale === "ru" ? "Адрес" : "Manzil"}
          </h2>
          <p className="mt-2 text-sm text-slate-700">{contact.address[locale]}</p>
        </div>
      </div>
    </div>
  );
}
