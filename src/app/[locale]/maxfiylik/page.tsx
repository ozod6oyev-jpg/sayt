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

  const description = t.meta.privacyDescription;

  return {
    title: t.footer.privacy,
    description,
    alternates: alternatesFor(locale, "/maxfiylik"),
    robots: { ...robotsMeta, index: true },
    ...socialMetadata({
      title: t.footer.privacy,
      description,
      path: `/${locale}/maxfiylik`,
      locale,
    }),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{t.footer.privacy}</h1>

      {locale === "ru" ? (
        <Card className="article-body mt-6 gap-0 p-6 sm:p-8">
          <p>
            Мы собираем только те данные, которые нужны для связи с вами: имя, номер телефона и
            текст сообщения. Эти данные не передаются третьим лицам, кроме случаев,
            предусмотренных законом.
          </p>
          <p>
            Файлы cookie используются для сохранения сессии администратора и анализа статистики
            посещений. Вы можете отключить cookie в настройках браузера.
          </p>
          <p className="mb-0">
            По вопросам удаления данных напишите в Telegram: {contact.telegramHandle} — мы
            удалим ваши данные в течение 30 дней.
          </p>
        </Card>
      ) : (
        <Card className="article-body mt-6 gap-0 p-6 sm:p-8">
          <p>
            Biz faqat siz bilan bog'lanish uchun kerakli ma'lumotlarni yig'amiz: ism, telefon
            raqami va xabar matni. Bu ma'lumotlar qonunda nazarda tutilgan holatlar bundan
            mustasno, uchinchi shaxslarga berilmaydi.
          </p>
          <p>
            Cookie fayllari administrator sessiyasini saqlash va tashriflar statistikasini tahlil
            qilish uchun ishlatiladi. Brauzer sozlamalarida cookie'ni o'chirib qo'yishingiz mumkin.
          </p>
          <p className="mb-0">
            Ma'lumotlarni o'chirish bo'yicha Telegram orqali bog'laning: {contact.telegramHandle} —
            30 kun ichida ma'lumotlaringizni o'chiramiz.
          </p>
        </Card>
      )}
    </div>
  );
}
