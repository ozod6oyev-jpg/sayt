import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { alternatesFor, robotsMeta } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);

  return {
    title: t.footer.privacy,
    alternates: alternatesFor(locale, "/maxfiylik"),
    robots: { ...robotsMeta, index: true },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold">{t.footer.privacy}</h1>

      {locale === "ru" ? (
        <div className="article-body mt-6">
          <p>
            Мы собираем только те данные, которые нужны для связи с вами: имя, номер телефона и
            текст сообщения. Эти данные не передаются третьим лицам, кроме случаев,
            предусмотренных законом.
          </p>
          <p>
            Файлы cookie используются для сохранения сессии администратора и анализа статистики
            посещений. Вы можете отключить cookie в настройках браузера.
          </p>
          <p>
            По вопросам удаления данных напишите на info@uyjoy.uz — мы удалим ваши данные в
            течение 30 дней.
          </p>
        </div>
      ) : (
        <div className="article-body mt-6">
          <p>
            Biz faqat siz bilan bog'lanish uchun kerakli ma'lumotlarni yig'amiz: ism, telefon
            raqami va xabar matni. Bu ma'lumotlar qonunda nazarda tutilgan holatlar bundan
            mustasno, uchinchi shaxslarga berilmaydi.
          </p>
          <p>
            Cookie fayllari administrator sessiyasini saqlash va tashriflar statistikasini tahlil
            qilish uchun ishlatiladi. Brauzer sozlamalarida cookie'ni o'chirib qo'yishingiz mumkin.
          </p>
          <p>
            Ma'lumotlarni o'chirish bo'yicha info@uyjoy.uz manziliga yozing — 30 kun ichida
            ma'lumotlaringizni o'chiramiz.
          </p>
        </div>
      )}
    </div>
  );
}
