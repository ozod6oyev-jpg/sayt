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

  const description = t.meta.rulesDescription;

  return {
    title: t.footer.rules,
    description,
    alternates: alternatesFor(locale, "/qoidalar"),
    robots: { ...robotsMeta, index: true },
    ...socialMetadata({
      title: t.footer.rules,
      description,
      path: `/${locale}/qoidalar`,
      locale,
    }),
  };
}

export default async function RulesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{t.footer.rules}</h1>

      {locale === "ru" ? (
        <Card className="article-body mt-6 gap-0 p-6 sm:p-8">
          <h2>1. Общие положения</h2>
          <p>
            Пользуясь сайтом, вы соглашаетесь с настоящими правилами. Сайт предназначен для
            размещения и поиска объявлений о продаже недвижимости; информация носит
            ознакомительный характер и не является публичной офертой.
          </p>

          <h2>2. Объявления</h2>
          <p>
            Ответственность за достоверность цены, адреса, площади, фотографий и контактных данных
            несёт лицо, разместившее объявление. Сайт выступает площадкой и не является стороной
            сделки.
          </p>

          <h2>3. Запрещается</h2>
          <ul>
            <li>публиковать недостоверные или чужие объявления без разрешения;</li>
            <li>размещать объекты, продажа которых ограничена или запрещена законом;</li>
            <li>рассылать спам, использовать автоматический сбор данных и вмешиваться в работу сайта.</li>
          </ul>

          <h2>4. Сделки и оплата</h2>
          <p>
            Сделки совершаются вне сайта. Не переводите предоплату незнакомым лицам и проверяйте
            документы на объект. Сайт не участвует в расчётах между сторонами.
          </p>

          <h2>5. Ответственность</h2>
          <p>
            Сайт не гарантирует непрерывную работу и не несёт ответственности за убытки, возникшие
            из-за действий третьих лиц или использования размещённой информации.
          </p>

          <h2>6. Изменения</h2>
          <p className="mb-0">
            Правила могут обновляться; действующая версия всегда опубликована на этой странице.
            Вопросы: Telegram {contact.telegramHandle} или {contact.phoneDisplay}.
          </p>
        </Card>
      ) : (
        <Card className="article-body mt-6 gap-0 p-6 sm:p-8">
          <h2>1. Umumiy qoidalar</h2>
          <p>
            Saytdan foydalanish orqali siz ushbu qoidalarga rozilik bildirasiz. Sayt uy-joy
            e'lonlarini joylashtirish va qidirish uchun xizmat qiladi; joylashtirilgan ma'lumot
            tanishtirish uchun bo'lib, ommaviy oferta hisoblanmaydi.
          </p>

          <h2>2. E'lonlar</h2>
          <p>
            Narx, manzil, maydon, rasmlar va aloqa ma'lumotlarining to'g'riligi uchun e'lonni
            joylashtirgan shaxs javobgar. Sayt platforma sifatida ishlaydi va bitim tarafi
            hisoblanmaydi.
          </p>

          <h2>3. Taqiqlanadi</h2>
          <ul>
            <li>yolg'on yoki boshqa shaxsga tegishli e'lonlarni ruxsatsiz joylashtirish;</li>
            <li>sotilishi qonun bilan cheklangan yoki taqiqlangan obyektlarni joylashtirish;</li>
            <li>spam tarqatish, ma'lumotlarni avtomatik yig'ish va sayt ishiga aralashish.</li>
          </ul>

          <h2>4. Bitimlar va to'lov</h2>
          <p>
            Bitimlar saytdan tashqarida tuziladi. Notanish shaxslarga oldindan to'lov qilmang va
            obyekt hujjatlarini tekshiring. Sayt tomonlar o'rtasidagi hisob-kitoblarda
            qatnashmaydi.
          </p>

          <h2>5. Javobgarlik</h2>
          <p>
            Sayt uzluksiz ishlashiga kafolat bermaydi va uchinchi shaxslar harakati yoki
            joylashtirilgan ma'lumotdan foydalanish natijasida kelib chiqqan zarar uchun javobgar
            emas.
          </p>

          <h2>6. O'zgartirishlar</h2>
          <p className="mb-0">
            Qoidalar yangilanishi mumkin; amaldagi versiya doim shu sahifada turadi. Savollar
            bo'yicha: Telegram {contact.telegramHandle} yoki {contact.phoneDisplay}.
          </p>
        </Card>
      )}
    </div>
  );
}
