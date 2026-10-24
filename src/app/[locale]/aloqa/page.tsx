import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock, Headphones, MapPin, Phone } from "lucide-react";
import {
  InstagramIcon,
  TelegramIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const description =
    locale === "ru"
      ? "Телефон, Telegram и адрес офиса Uy-joylar sotamiz в Ташкенте."
      : "Uy-joylar sotamiz bilan bog'lanish: telefon, Telegram va Toshkentdagi manzil.";

  return {
    title,
    description,
    alternates: alternatesFor(locale, "/aloqa"),
    robots: robotsMeta,
    ...socialMetadata({ title, description, path: `/${locale}/aloqa`, locale }),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  return (
    <div>
      <section className="bg-brand-900 py-10 text-white sm:py-14">
        <div className="container-page max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-xs font-bold tracking-[0.18em] text-brand-200 uppercase">
            {siteName}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t.nav.contact}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-brand-100/85">
            {locale === "ru"
              ? "Позвоните или напишите в Telegram — ответим на вопросы по объектам и сделке."
              : "Qo'ng'iroq qiling yoki Telegramda yozing — obyekt va bitim bo'yicha savollarga javob beramiz."}
          </p>
        </div>
      </section>

      <div className="container-page mt-8 grid max-w-4xl gap-4 pb-4 lg:grid-cols-2">
        <Card className="gap-0 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Phone className="size-4" />
            </span>
            {locale === "ru" ? "Телефон" : "Telefon"}
          </div>
          <p className="mt-4 text-sm font-medium text-slate-900">{contact.name}</p>
          <a
            href={contact.phoneHref}
            className="font-display mt-1 block text-2xl font-extrabold tracking-tight text-brand-800 hover:underline"
          >
            {contact.phoneDisplay}
          </a>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {contact.hours[locale]}
          </p>
          <Button asChild className="mt-4 w-full sm:w-auto">
            <a href={contact.phoneHref}>
              <Phone className="size-4" />
              {locale === "ru" ? "Позвонить" : "Qo'ng'iroq qilish"}
            </a>
          </Button>
        </Card>

        <Card className="gap-0 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#229ED9]/10 text-[#229ED9]">
              <TelegramIcon className="h-4 w-4" />
            </span>
            Telegram
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {locale === "ru"
              ? "Быстрая связь с менеджером в Telegram."
              : "Menejer bilan Telegram orqali tez bog'lanish."}
          </p>
          <a
            href={contact.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-lg font-semibold text-brand-700 hover:underline"
          >
            {contact.telegramHandle}
            <ArrowUpRight className="size-4" />
          </a>
          <Button asChild className="mt-4 w-full sm:w-auto">
            <a href={contact.telegramUrl} target="_blank" rel="noopener noreferrer">
              <Headphones className="size-4" />
              {locale === "ru" ? "Связаться" : "Bog'lanish"}
            </a>
          </Button>
        </Card>

        <Card className="gap-0 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <MapPin className="size-4" />
            </span>
            {locale === "ru" ? "Адрес" : "Manzil"}
          </div>
          <a
            href={contact.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-start gap-2 text-sm font-medium text-slate-700 hover:text-brand-700"
          >
            <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" />
            {contact.address[locale]}
          </a>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {contact.hours[locale]}
          </p>
          <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
            <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="size-4" />
              {locale === "ru" ? "Открыть на карте" : "Xaritada ochish"}
            </a>
          </Button>
        </Card>

        <Card className="gap-0 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <InstagramIcon className="h-4 w-4" />
            </span>
            {locale === "ru" ? "Наши соцсети" : "Ijtimoiy tarmoqlarimiz"}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-between">
              <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer">
                <span className="inline-flex items-center gap-2">
                  <InstagramIcon className="h-4 w-4 text-[#E1306C]" />
                  Instagram
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {contact.instagramHandle}
                </span>
              </a>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <a href={contact.telegramChannelUrl} target="_blank" rel="noopener noreferrer">
                <span className="inline-flex items-center gap-2">
                  <TelegramIcon className="h-4 w-4 text-[#229ED9]" />
                  Telegram
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {contact.telegramChannelHandle}
                </span>
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
