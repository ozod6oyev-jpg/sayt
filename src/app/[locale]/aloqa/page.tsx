import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
          <a href="tel:+998901234567" className="mt-2 block text-lg font-semibold text-brand-700">
            +998 90 123 45 67
          </a>
          <p className="mt-1 text-xs text-slate-500">
            {locale === "ru" ? "Ежедневно, 9:00–19:00" : "Har kuni, 9:00–19:00"}
          </p>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">Email</h2>
          <a href="mailto:info@uyjoy.uz" className="mt-2 block text-lg font-semibold text-brand-700">
            info@uyjoy.uz
          </a>
          <p className="mt-1 text-xs text-slate-500">
            {locale === "ru" ? "Ответим в течение рабочего дня" : "Ish kuni ichida javob beramiz"}
          </p>
        </div>

        <div className="card p-5 sm:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">
            {locale === "ru" ? "Адрес" : "Manzil"}
          </h2>
          <p className="mt-2 text-sm text-slate-700">Toshkent sh., Amir Temur ko'chasi, 1</p>
        </div>
      </div>
    </div>
  );
}
