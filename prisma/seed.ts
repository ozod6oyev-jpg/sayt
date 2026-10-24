import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { articles } from "./articles";

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
      <text x="${width * 0.12}" y="${height * 0.79}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${Math.round(width / 45)}" fill="#d5f2e6">Uy-joylar sotamiz demo rasmi</text>
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
    phone: "+998 90 370 68 83",
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
    phone: "+998 90 370 68 83",
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
    phone: "+998 90 370 68 83",
    status: "active",
    views: 203,
  },
  {
    slug: "sergeli-1-xonali-kvartira",
    type: "sale",
    propertyType: "apartment",
    titleUz: "Sergelida 1 xonali kvartira, yangi bino",
    titleRu: "1-комнатная квартира в новом доме в Сергели",
    descriptionUz:
      "Sergeli tumanida, yangi binoda 1 xonali kvartira sotiladi. Mebel va texnika qoladi.\n\nHujjatlar tayyor, naqd yoki ipoteka orqali xarid qilish mumkin.\n\nMetro va bozor yaqin.",
    descriptionRu:
      "Продаётся 1-комнатная квартира в новом доме в Сергели. Мебель и техника остаются.\n\nДокументы готовы, возможна покупка за наличные или в ипотеку.\n\nРядом метро и рынок.",
    price: 45000n,
    currency: "USD",
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
    phone: "+998 90 370 68 83",
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
    phone: "+998 90 370 68 83",
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
      "Samarqand shahri markazida, Registon yodgorligidan 10 daqiqa masofada 3 xonali kvartira.\n\nKvartira ta'mirlangan, hujjatlar tayyor. Ipoteka orqali xarid qilish mumkin.\n\nYopiq hovli, videokuzatuv mavjud.",
    descriptionRu:
      "3-комнатная квартира в центре Самарканда, 10 минут от Регистана.\n\nС ремонтом, документы готовы. Возможна покупка в ипотеку.\n\nЗакрытый двор, видеонаблюдение.",
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
    phone: "+998 90 370 68 83",
    status: "active",
    views: 77,
  },
];

async function main() {
  await mkdir(uploadsDir, { recursive: true });

  const saleOptionSeeds = [
    { slug: "naqd", nameUz: "Naqd", nameRu: "Наличные", sort: 0 },
    { slug: "ipoteka", nameUz: "Ipoteka", nameRu: "Ипотека", sort: 1 },
  ];

  const saleOptions: Record<string, string> = {};

  for (const option of saleOptionSeeds) {
    const saved = await prisma.saleOption.upsert({
      where: { slug: option.slug },
      update: { nameUz: option.nameUz, nameRu: option.nameRu, sort: option.sort },
      create: option,
    });
    saleOptions[option.slug] = saved.id;
  }  const demoImages: Record<string, string> = {
    "chilonzor-3-xonali-kvartira": "chilonzor.jpg",
    "yunusobod-2-xonali-kvartira": "yunusobod.jpg",
    "mirzo-ulugbek-hovli-uy": "mirzo-ulugbek.jpg",
    "sergeli-1-xonali-kvartira": "sergeli.jpg",
    "shayxontohur-yer-uchastkasi": "shayxontohur.jpg",
    "samarqand-markaz-3-xonali": "samarqand.jpg",
  };

  for (const item of listings) {
    const saleOptionSlug =
      item.slug === "chilonzor-3-xonali-kvartira" || item.slug === "samarqand-markaz-3-xonali"
        ? "ipoteka"
        : "naqd";
    const demoImage = demoImages[item.slug] ?? "chilonzor.jpg";


    await prisma.listing.upsert({
      where: { slug: item.slug },
      update: {
        titleUz: item.titleUz,
        titleRu: item.titleRu,
        descriptionUz: item.descriptionUz,
        descriptionRu: item.descriptionRu,
        price: item.price,
        status: item.status,
        saleOptionId: saleOptions[saleOptionSlug],
      },
      create: {
        slug: item.slug,
        type: item.type,
        saleOptionId: saleOptions[saleOptionSlug],
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
          create: [
            {
              url: `/demo/${demoImage}`,
              alt: `${item.titleUz} — asosiy rasm`,
              width: 1600,
              height: 1000,
              sort: 0,
            },
          ],
        },
      },
    });
  }

  for (const article of articles) {
    const cover = await makeImage(`${article.slug}-cover`, "Uy-joylar sotamiz", "#0f4f3e", "#d99a2b", 1600, 900);

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        titleUz: article.titleUz,
        titleRu: article.titleRu,
        excerptUz: article.excerptUz,
        excerptRu: article.excerptRu,
        bodyUz: article.bodyUz,
        bodyRu: article.bodyRu,
        category: article.category,
        authorName: article.authorName,
        authorRole: article.authorRole,
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
