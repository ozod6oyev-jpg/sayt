import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { contact } from "@/lib/contact";
import { getDict, isLocale } from "@/lib/i18n";
import { alternatesFor, robotsMeta, socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);

  const description = t.meta.copyrightDescription;

  return {
    title: t.footer.copyright,
    description,
    alternates: alternatesFor(locale, "/mualliflik"),
    robots: { ...robotsMeta, index: true },
    ...socialMetadata({
      title: t.footer.copyright,
      description,
      path: `/${locale}/mualliflik`,
      locale,
    }),
  };
}

export default async function CopyrightPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{t.footer.copyright}</h1>

      {locale === "ru" ? (
        <Card className="article-body mt-6 gap-0 p-6 sm:p-8">
          <h2>Бренд и логотип</h2>
          <p>
            Название «Real sotamiz», логотип и фирменный стиль являются зарегистрированными
            объектами интеллектуальной собственности (патент/свидетельство на товарный знак).
            Их использование, копирование, изменение и регистрация схожих обозначений без
            письменного разрешения правообладателя запрещены.
          </p>

          <h2>Контент сайта</h2>
          <p>
            Тексты, описания объявлений, фотографии, подборки, дизайн, вёрстка и программный код
            сайта охраняются законодательством об авторском праве. Все права принадлежат
            правообладателю бренда.
          </p>

          <h2>Разрешённое использование</h2>
          <p>
            Допускается краткое цитирование материалов с обязательной ссылкой на страницу сайта и
            активной гиперссылкой. Коммерческое копирование, перепубликация и использование
            материалов в других сервисах допускаются только с письменного разрешения.
          </p>

          <h2>Нарушения</h2>
          <p>
            При обнаружении копирования бренда или контента напишите в Telegram{" "}
            {contact.telegramHandle} или позвоните по номеру {contact.phoneDisplay}. Обращение
            рассматривается в течение 5 рабочих дней; при подтверждении нарушения материалы
            удаляются, а доступ ограничивается.
          </p>

          <p className="mb-0">
            Официальные материалы и логотип предоставляются только для партнёров и СМИ — по
            запросу через те же контакты.
          </p>
        </Card>
      ) : (
        <Card className="article-body mt-6 gap-0 p-6 sm:p-8">
          <h2>Brend va logotip</h2>
          <p>
            «Real sotamiz» nomi, logotipi va korporativ uslubi intellektual mulk obyekti sifatida
            patentlangan (tovar belgisi guvohnomasi bilan himoyalangan). Ulardan yozma ruxsatsiz
            foydalanish, ko'chirish, o'zgartirish va o'xshash belgilarni ro'yxatdan o'tkazish
            taqiqlanadi.
          </p>

          <h2>Sayt kontenti</h2>
          <p>
            Matnlar, e'lon tavsiflari, fotosuratlar, to'plamlar, dizayn, sahifa tuzilishi va sayt
            dastur kodi mualliflik huquqi qonunchiligi bilan himoyalangan. Barcha huquqlar brend
            egasiga tegishli.
          </p>

          <h2>Ruxsat etilgan foydalanish</h2>
          <p>
            Materiallardan qisqa iqtibos keltirish, sayt sahifasiga majburiy manba va faol havola
            bilan ruxsat etiladi. Tijoriy maqsadda ko'chirish, qayta nashr qilish va boshqa
            xizmatlarda foydalanish faqat yozma ruxsat bilan mumkin.
          </p>

          <h2>Huquqbuzarlik haqida</h2>
          <p>
            Brend yoki kontent nusxalanganini aniqlasangiz, Telegram orqali yozing:{" "}
            {contact.telegramHandle} yoki {contact.phoneDisplay} raqamiga qo'ng'iroq qiling.
            Murojaat 5 ish kuni ichida ko'rib chiqiladi; huquqbuzarlik tasdiqlansa, materiallar
            olib tashlanadi va kirish cheklanadi.
          </p>

          <p className="mb-0">
            Rasmiy materiallar va logotip faqat hamkorlar va OAV uchun, shu kontaktlar orqali
            so'rov asosida taqdim etiladi.
          </p>
        </Card>
      )}
    </div>
  );
}
