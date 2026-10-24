import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();

const uploadsDir = path.join(process.cwd(), "uploads");

type GeneratedImage = { url: string; width: number; height: number };

async function makeImage(
  name: string,
  label: string,
  from: string,
  to: string,
  width = 1600,
  height = 1067,
): Promise<GeneratedImage> {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="${width * 0.82}" cy="${height * 0.2}" r="${height * 0.22}" fill="#ffffff" opacity="0.12"/>
      <rect x="${width * 0.08}" y="${height * 0.62}" width="${width * 0.84}" height="${height * 0.22}" rx="24" fill="#0d4134" opacity="0.55"/>
      <text x="${width * 0.12}" y="${height * 0.72}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${Math.round(width / 26)}" fill="#ffffff">${label}</text>
      <text x="${width * 0.12}" y="${height * 0.79}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${Math.round(width / 45)}" fill="#d5f2e6">UyJoy demo rasmi</text>
    </svg>`;

  const buffer = await sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
  await writeFile(path.join(uploadsDir, `${name}.webp`), buffer);

  return { url: `/uploads/${name}.webp`, width, height };
}

const listings = [
  {
    slug: "chilonzor-3-xonali-kvartira",
    type: "sale",
    propertyType: "apartment",
    titleUz: "Chilonzorda 3 xonali, ta'mirlangan kvartira",
    titleRu: "3-комнатная квартира с ремонтом в Чиланзаре",
    descriptionUz:
      "Chilonzor 9-mavzesida, metrodan 7 daqiqa piyoda masofada joylashgan 3 xonali kvartira.\n\nKvartira to'liq ta'mirlangan: yangi oshxona mebeli, plastik derazalar, konditsioner o'rnatilgan. Hujjatlar tayyor, ipoteka bilan sotib olish mumkin.\n\nUy 2019-yilda qurilgan, lift va yopiq hovli mavjud. Maktab va bog'cha yaqin.",
    descriptionRu:
      "3-комнатная квартира в 9-м квартале Чиланзара, 7 минут пешком от метро.\n\nПолный ремонт: новая кухня, пластиковые окна, кондиционер. Документы готовы, возможна ипотека.\n\nДом 2019 года, есть лифт и закрытый двор. Рядом школа и детский сад.",
    price: 92000n,
    currency: "USD",
    rooms: 3,
    area: 78,
    floor: 4,
    totalFloors: 9,
    yearBuilt: 2019,
    condition: "renovated",
    region: "Toshkent shahri",
    district: "Chilonzor",
    address: "Chilonzor 9-mavze, 21-uy",
    lat: 41.2856,
    lng: 69.2034,
    phone: "+998 90 123 45 67",
    status: "active",
    views: 148,
  },
  {
    slug: "yunusobod-2-xonali-kvartira",
    type: "sale",
    propertyType: "apartment",
    titleUz: "Yunusobodda 2 xonali kvartira, yangi bino",
    titleRu: "2-комнатная квартира в новостройке Юнусабада",
    descriptionUz:
      "Yunusobod 4-mavzesida yangi qurilgan uyda 2 xonali kvartira. Oshxona va hammom to'liq jihozlangan, pollar laminat.\n\nHovlida avtoturargoh, bolalar maydonchasi bor. Metro bekati 10 daqiqalik yo'lda.\n\nKvartira bo'sh, kalitni darhol topshirish mumkin.",
    descriptionRu:
      "2-комнатная квартира в новом доме в 4-м квартале Юнусабада. Кухня и санузел полностью оборудованы, полы ламинат.\n\nВо дворе парковка и детская площадка. До метро 10 минут.\n\nКвартира свободна, ключи сразу.",
    price: 71000n,
    currency: "USD",
    rooms: 2,
    area: 58,
    floor: 7,
    totalFloors: 12,
    yearBuilt: 2023,
    condition: "new",
    region: "Toshkent shahri",
    district: "Yunusobod",
    address: "Yunusobod 4-mavze, 12-uy",
    lat: 41.3562,
    lng: 69.2874,
    phone: "+998 90 123 45 67",
    status: "active",
    views: 96,
  },
  {
    slug: "mirzo-ulugbek-hovli-uy",
    type: "sale",
    propertyType: "house",
    titleUz: "Mirzo Ulug'bekda 6 sotixli hovli uy",
    titleRu: "Дом с участком 6 соток в Мирзо-Улугбекском районе",
    descriptionUz:
      "Mirzo Ulug'bek tumanida, 6 sotix yer uchastkasida joylashgan hovli uy. Uy 2015-yilda qurilgan, 4 xona, 2 qavat.\n\nGaz, suv, elektr kommunikatsiyalari mavjud. Hovlida mevali daraxtlar va avtoturargoh.\n\nTinch ko'cha, markazga 15 daqiqa.",
    descriptionRu:
      "Дом на участке 6 соток в Мирзо-Улугбекском районе. Построен в 2015 году, 4 комнаты, 2 этажа.\n\nЕсть газ, вода, электричество. Во дворе фруктовые деревья и парковка.\n\nТихая улица, до центра 15 минут.",
    price: 165000n,
    currency: "USD",
    rooms: 4,
    area: 180,
    floor: 1,
    totalFloors: 2,
    yearBuilt: 2015,
    condition: "renovated",
    region: "Toshkent shahri",
    district: "Mirzo Ulugbek",
    address: "Buyuk ipak yo'li ko'chasi, 45",
    lat: 41.3254,
    lng: 69.3345,
    phone: "+998 90 123 45 67",
    status: "active",
    views: 203,
  },
  {
    slug: "sergeli-ijara-1-xonali",
    type: "rent",
    propertyType: "apartment",
    titleUz: "Sergelida 1 xonali kvartira, ijara",
    titleRu: "1-комнатная квартира в Сергели, аренда",
    descriptionUz:
      "Sergeli tumanida, yangi binoda 1 xonali kvartira ijaraga beriladi. Mebel va texnika to'liq.\n\nKommunal to'lovlar alohida. 6 oydan boshlab uzoq muddatli ijara.\n\nMetro va bozor yaqin.",
    descriptionRu:
      "Сдаётся 1-комнатная квартира в новом доме в Сергели. Полностью с мебелью и техникой.\n\nКоммунальные платежи отдельно. Долгосрочная аренда от 6 месяцев.\n\nРядом метро и рынок.",
    price: 3500000n,
    currency: "UZS",
    rooms: 1,
    area: 34,
    floor: 3,
    totalFloors: 9,
    yearBuilt: 2022,
    condition: "renovated",
    region: "Toshkent shahri",
    district: "Sergeli",
    address: "Sergeli 6-mavze, 8-uy",
    lat: 41.2225,
    lng: 69.2228,
    phone: "+998 90 123 45 67",
    status: "active",
    views: 64,
  },
  {
    slug: "shayxontohur-yer-uchastkasi",
    type: "sale",
    propertyType: "land",
    titleUz: "Shayxontohurda 8 sotixli yer uchastkasi",
    titleRu: "Участок 8 соток в Шайхантахурском районе",
    descriptionUz:
      "Shayxontohur tumanida, asfalt yo'l bo'yida 8 sotixli yer uchastkasi. Kommunikatsiyalar ko'chada mavjud.\n\nQurilish uchun barcha ruxsatnomalar tayyor. Yer kadastr hujjatlari to'liq.\n\nSavdo yoki turar-joy qurish uchun mos.",
    descriptionRu:
      "Участок 8 соток в Шайхантахурском районе вдоль асфальтированной дороги. Коммуникации по улице.\n\nВсе разрешения на строительство готовы. Кадастровые документы в порядке.\n\nПодходит для жилого дома или коммерции.",
    price: 78000n,
    currency: "USD",
    rooms: null,
    area: 800,
    floor: null,
    totalFloors: null,
    yearBuilt: null,
    condition: null,
    region: "Toshkent shahri",
    district: "Shayxontohur",
    address: "Navoiy ko'chasi, 120",
    lat: 41.3261,
    lng: 69.2166,
    phone: "+998 90 123 45 67",
    status: "active",
    views: 41,
  },
  {
    slug: "samarqand-markaz-3-xonali",
    type: "sale",
    propertyType: "apartment",
    titleUz: "Samarqand markazida 3 xonali kvartira",
    titleRu: "3-комнатная квартира в центре Самарканда",
    descriptionUz:
      "Samarqand shahri markazida, Registon yodgorligidan 10 daqiqa masofada 3 xonali kvartira.\n\nKvartira ta'mirlangan, hujjatlar tayyor. Turistik ijara uchun ham mos.\n\nYopiq hovli, videokuzatuv mavjud.",
    descriptionRu:
      "3-комнатная квартира в центре Самарканда, 10 минут от Регистана.\n\nС ремонтом, документы готовы. Подходит и для туристической аренды.\n\nЗакрытый двор, видеонаблюдение.",
    price: 64000n,
    currency: "USD",
    rooms: 3,
    area: 82,
    floor: 2,
    totalFloors: 5,
    yearBuilt: 2018,
    condition: "renovated",
    region: "Samarqand viloyati",
    district: "Samarqand",
    address: "Registon ko'chasi, 14",
    lat: 39.6542,
    lng: 66.9597,
    phone: "+998 90 123 45 67",
    status: "active",
    views: 77,
  },
];

const articles = [
  {
    slug: "toshkent-kvartira-narxlari-2026",
    titleUz: "Toshkentda kvartira narxlari 2026: tumanlar bo'yicha tahlil",
    titleRu: "Цены на квартиры в Ташкенте в 2026 году: анализ по районам",
    excerptUz:
      "Qaysi tumanda kvadrat metr eng qimmat, qayerda narx o'sishda davom etmoqda va xaridor uchun qaysi variant foydali — raqamlar bilan tahlil.",
    excerptRu:
      "Где квадратный метр самый дорогой, где цены продолжают расти и какой район выгоден покупателю — анализ в цифрах.",
    bodyUz: `Toshkent uy-joy bozori 2026-yilda ham faol bo'lib qolmoqda. Yangi qurilgan uylar soni oshgani bilan, markazga yaqin tumanlarda talab barqaror.

## Tumanlar bo'yicha o'rtacha narx

Yunusobod va Mirzo Ulug'bek tumanlarida kvadrat metr narxi eng yuqori darajada saqlanib qolmoqda. Bu yerda yangi binolar, maktablar va savdo markazlari zich joylashgan.

Chilonzor va Sergeli esa narx bo'yicha qulayroq variant bo'lib qolmoqda. Metro yaqinligi bu tumanlarda ijara bozorini ham faol qiladi.

## Xaridor nimalarga e'tibor berishi kerak

- Uyning qurilgan yili va quruvchi kompaniyaning obro'si
- Hujjatlarning tozaligi (kadastr, kommunal qarzlar)
- Hovli va avtoturargoh holati
- Maktab, bog'cha va transport masofasi

## Xulosa

Agar maqsad — o'z yashash joyi, markazga yaqinlik muhim bo'lsa, Yunusobod va Mirzo Ulug'bek mos. Byudjetni tejash kerak bo'lsa, Chilonzor va Sergelidagi yangi binolarni ko'rib chiqish arziydi.`,
    bodyRu: `Рынок жилья Ташкента остаётся активным и в 2026 году. Количество новостроек растёт, но спрос в центральных районах стабилен.

## Средние цены по районам

Самая высокая цена за квадратный метр сохраняется в Юнусабадском и Мирзо-Улугбекском районах. Здесь сосредоточены новостройки, школы и торговые центры.

Чиланзар и Сергели остаются более доступными. Близость метро поддерживает и рынок аренды в этих районах.

## На что обратить внимание покупателю

- Год постройки дома и репутация застройщика
- Чистота документов (кадастр, долги по коммунальным)
- Состояние двора и парковки
- Расстояние до школы, садика и транспорта

## Вывод

Если важно жить ближе к центру — подойдут Юнусабад и Мирзо-Улугбек. Если бюджет ограничен — стоит посмотреть новостройки в Чиланзаре и Сергели.`,
    category: "bozor",
    authorName: "Aziz Karimov",
    authorRole: "Ko'chmas mulk bo'yicha tahlilchi",
  },
  {
    slug: "uy-sotib-olishda-7-xato",
    titleUz: "Uy sotib olishda 7 ta xato va ulardan qanday qochish kerak",
    titleRu: "7 ошибок при покупке жилья и как их избежать",
    excerptUz:
      "Hujjatlarni tekshirmaslikdan tortib, yashirin qarzlarni payqamaslikkacha — xaridorlar eng ko'p yo'l qo'yadigan xatolar.",
    excerptRu:
      "От непроверенных документов до скрытых долгов — самые частые ошибки покупателей жилья.",
    bodyUz: `Uy sotib olish — hayotdagi eng katta xaridlardan biri. Quyidagi xatolar ko'p uchraydi va ularni oldindan bilish pul va asablarni saqlaydi.

## 1. Hujjatlarni tekshirmaslik

Kadastr raqami, mulkdorning shaxsi, garov va sud ishlari bo'yicha ma'lumotnoma olinishi shart. Bu 1-2 kun vaqt oladi, lekin eng katta xatarlarni yo'q qiladi.

## 2. Kommunal qarzlarni tekshirmaslik

Eski egasining suv, gaz va elektr qarzlari yangi egaga o'tishi mumkin. Shartnomada qarzlar bo'yicha band qo'shing.

## 3. Faqat rasmga qarab qaror qabul qilish

Rasmlar keng burchakli obyektiv bilan olingan bo'lishi mumkin. Uyni albatta o'zingiz ko'ring, kunduzi va kechqurun.

## 4. Uyning texnik holatini tekshirmaslik

Devorlardagi yoriqlar, namlik, tom va kanalizatsiya holati — bularni mutaxassis bilan ko'rish yaxshiroq.

## 5. To'lov tartibini yozmaslik

To'lov bosqichlari, avans miqdori va qaytarish shartlari shartnomada aniq yozilsin.

## 6. Soliq va rasmiylashtirish xarajatlarini hisoblamaslik

Notarius, davlat boji va ro'yxatdan o'tkazish xarajatlari umumiy byudjetning bir qismi.

## 7. Shoshilish

"Yana kimdir olib qo'yadi" degan bosim ostida qaror qabul qilmang. Yaxshi obyektlar ko'p.`,
    bodyRu: `Покупка жилья — одна из самых крупных сделок в жизни. Эти ошибки встречаются чаще всего, и знание о них помогает сохранить деньги и нервы.

## 1. Не проверить документы

Кадастровый номер, личность собственника, справки о залоге и судебных делах обязательны. Это займёт 1–2 дня, но снимет главные риски.

## 2. Не проверить долги по коммунальным

Долги прежнего владельца за воду, газ и электричество могут перейти к новому. Пропишите это в договоре.

## 3. Решать только по фотографиям

Фото могут быть сняты широкоугольным объективом. Обязательно посмотрите объект лично, днём и вечером.

## 4. Не проверить техническое состояние

Трещины, влажность, состояние крыши и канализации лучше оценить со специалистом.

## 5. Не прописать порядок оплаты

Этапы оплаты, размер задатка и условия возврата должны быть чётко указаны в договоре.

## 6. Не учесть налоги и расходы на оформление

Нотариус, госпошлина и регистрация — часть общего бюджета.

## 7. Спешка

Не принимайте решение под давлением «сейчас заберут». Хороших объектов много.`,
    category: "qollanma",
    authorName: "Dilnoza Rahimova",
    authorRole: "Yurist, ko'chmas mulk bo'yicha mutaxassis",
  },
];

async function main() {
  await mkdir(uploadsDir, { recursive: true });

  for (const item of listings) {
    const images = [
      await makeImage(`${item.slug}-1`, "Tashqi ko'rinish", "#0e634b", "#43b88c"),
      await makeImage(`${item.slug}-2`, "Ichki ko'rinish", "#1e3a5f", "#5b8db8"),
    ];

    await prisma.listing.upsert({
      where: { slug: item.slug },
      update: {
        titleUz: item.titleUz,
        titleRu: item.titleRu,
        descriptionUz: item.descriptionUz,
        descriptionRu: item.descriptionRu,
        price: item.price,
        status: item.status,
      },
      create: {
        slug: item.slug,
        type: item.type,
        propertyType: item.propertyType,
        titleUz: item.titleUz,
        titleRu: item.titleRu,
        descriptionUz: item.descriptionUz,
        descriptionRu: item.descriptionRu,
        price: item.price,
        currency: item.currency,
        rooms: item.rooms,
        area: item.area,
        floor: item.floor,
        totalFloors: item.totalFloors,
        yearBuilt: item.yearBuilt,
        condition: item.condition,
        region: item.region,
        district: item.district,
        address: item.address,
        lat: item.lat,
        lng: item.lng,
        phone: item.phone,
        status: item.status,
        views: item.views,
        photos: {
          create: images.map((image, index) => ({
            url: image.url,
            alt: `${item.titleUz} — ${index === 0 ? "tashqi ko'rinish" : "ichki ko'rinish"}`,
            width: image.width,
            height: image.height,
            sort: index,
          })),
        },
      },
    });
  }

  for (const article of articles) {
    const cover = await makeImage(`${article.slug}-cover`, "UyJoy", "#0f4f3e", "#d99a2b", 1600, 900);

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        titleUz: article.titleUz,
        titleRu: article.titleRu,
        published: true,
      },
      create: {
        ...article,
        coverImage: cover.url,
        coverWidth: cover.width,
        coverHeight: cover.height,
        published: true,
        publishedAt: new Date(),
      },
    });
  }

  const counts = {
    listings: await prisma.listing.count(),
    articles: await prisma.article.count(),
  };

  console.log(`Seed tayyor: ${counts.listings} e'lon, ${counts.articles} maqola`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
