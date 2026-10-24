# Uy-joy sayti — Loyiha rejasi

Maqsad: O'zbekistonda uy-joy sotadigan sayt. Foydalanuvchi rasmlar va ma'lumotlarni
o'zi yuklaydi. Sayt Google qidiruvida va Google Discover'da chiqadi.

---

## 1. Kontent strategiyasi (eng muhim qism)

Google Discover **e'londan** traffic bermaydi — u **foydali kontentni** ko'rsatadi.
Shuning uchun sayt ikki qismdan iborat bo'lishi shart:

| Qism | Vazifasi | Google'dagi roli |
|---|---|---|
| **E'lonlar** (listinglar) | Uylar, kvartiralar, yer uchastkalari | Google Search — "Toshkentda 3 xonali kvartira" so'rovlari |
| **Kontent / Blog** | Bozor tahlili, tumanlar bo'yicha qo'llanmalar, maslahatlar | Google Discover — asosiy traffic manbai |

Discover uchun ishlaydigan mavzular (oyiga 8–15 ta maqola):
- "Chilonzorda kvartira narxlari — 2026 tahlili"
- "Uy sotib olishda 7 ta xato (advokat maslahati)"
- "Ipoteka: qaysi bank qulay?" (solishtirish jadvali)
- "Yangi qurilgan uylarni tekshirish: qabul qilishda nimalarga e'tibor berish"
- "Toshkent tumanlari reytingi: qayerda yashash qulay"

Har maqola: 800–1500 so'z, 3–5 ta original rasm (kamera bilan, 1200px+), muallif ismi
va tajribasi (E-E-A-T), sana, yangilangan sana. **AI bilan yozilgan quruq matn
Discover'da ishlamaydi** — Google "people-first" kontentni talab qiladi.

## 2. Texnologiyalar (stack)

- **Next.js 15 (App Router, TypeScript)** — server-side rendering, SEO uchun eng qulay.
  Google bot sahifani to'liq HTML ko'rinishida oladi.
- **PostgreSQL** (Neon / Supabase) — e'lonlar, foydalanuvchilar, maqolalar.
- **Prisma** — ma'lumotlar bazasi bilan ishlash.
- **S3-mos obyekt saqlash** (Cloudflare R2 / Supabase Storage) — rasmlar uchun.
- **Cloudflare CDN** — rasmlarni dunyo bo'ylab tez yetkazish, keshlash.
- **next/image + sharp** — rasmlarni AVIF/WebP ga avtomatik aylantirish.
- **Tailwind CSS** — mobilga moslashgan (responsive) dizayn.
- Deploy: **Vercel** (yoki Cloudflare Pages) — GitHub repo'ga ulangan, `main` ga
  push bo'lishi bilan avtomatik chiqadi.

Sabab: hammasi bepul tarifda boshlanadi, Discover talab qiladigan tezlik va
SSR'ni tabiiy ravishda beradi.

## 3. Sayt tuzilishi (sahifalar)

```
/                          — Bosh sahifa: oxirgi e'lonlar + oxirgi maqolalar
/elonlar                   — Filtrli ro'yxat (tuman, narx, xonalar, tur)
/elonlar/[slug]            — Bitta e'lon: galereya, xarita, narx, tavsif, aloqa
/tumanlar/[tuman]          — Tuman bo'yicha SEO sahifa ("Chilonzorda kvartiralar")
/blog                      — Maqolalar ro'yxati
/blog/[slug]               — Maqola (Discover uchun asosiy sahifa)
/ipoteka                   — Ipoteka kalkulyatori + banklar
/admin                     — Boshqaruv paneli (faqat siz uchun)
/about, /aloqa, /maxfiylik — Statik sahifalar
```

## 4. Ma'lumotlar modeli

```
Region      — viloyat / shahar
District    — tuman (Region ga bog'langan)
Listing     — e'lon: turi (sotuv/ijara), obyekt turi (kvartira/uy/yer/tijorat),
              narx + valyuta (UZS/USD), xonalar, qavat/qavatlar, maydon (m²),
              qurilgan yil, holat (yangi/ta'mirlangan), manzil, lat/lng,
              tavsif, aloqa telefon, status (qoralama/faol/sotilgan), slug,
              ko'rishlar soni, yaratilgan/yangilangan sana
ListingPhoto— listing_id, URL, tartib, alt matn (SEO uchun)
Article     — maqola: sarlavha, slug, matn (MDX), muallif, muqova rasm,
              kategoriya, nashr sanasi, yangilangan sana, teg
Lead        — qo'ng'iroq/forma so'rovlari (kim qaysi e'longa qiziqdi)
AdminUser   — email + parol (yoki magic link)
```

## 5. Rasm yuklash (kritik qism)

Discover va Search uchun rasm sifati hal qiluvchi:

- **Kamida 1200 piksel kenglik** (Discover talabi). Asl nusxani saqlaymiz.
- Avtomatik generatsiya: 400px (katalog), 800px (karta), 1200px, 1920px (galereya),
  1200×630 (Open Graph), 1200×900 va 1200×675 (Discover uchun 4:3 va 16:9).
- Format: AVIF → WebP → JPEG fallback. Har rasm **200 KB dan kam** bo'lishi kerak.
- EXIF tozalash (GPS/telefon modeli), ixtiyoriy suv belgisi.
- Drag & drop yuklash, tartibni o'zgartirish, o'chirish — admin panelda.
- Har rasmga **alt matn** (masalan: "Chilonzorda 3 xonali kvartira oshxonasi").

## 6. SEO — Google qidiruv

1. **Texnik:**
   - SSR/SSG — har sahifa to'liq HTML (Next.js `generateMetadata`).
   - `sitemap.xml` — e'lonlar, maqolalar, tuman sahifalari avtomatik.
   - `robots.txt` — admin va ichki sahifalar yopiladi, sitemap ko'rsatiladi.
   - Kanonik URL'lar, sahifalash (`rel=prev/next`), 404/410 to'g'ri javob.
   - Til: birlamchi `uz`, `ru` versiyasi bo'lsa `hreflang` (uz/ru) qo'shiladi.
2. **Strukturaviy ma'lumot (JSON-LD):**
   - E'lon: `RealEstateListing` + `Offer` (narx, valyuta, mavjudlik) + `Place`
     (manzil, geo) + `BreadcrumbList`.
   - Maqola: `Article` (`headline`, `image`, `datePublished`, `dateModified`,
     `author` — haqiqiy shaxs).
   - Tashkilot: `Organization` (logo, aloqa, ijtimoiy tarmoqlar).
3. **Google Search Console:** domen tasdiqlash, sitemap yuborish, indekslashni
   kuzatish, `Rich Results Test` bilan tekshirish.
4. **Mahalliy SEO:** Google Business Profile, NAP (nom/manzil/telefon) bir xil
   bo'lishi, mijoz sharhlari.
5. **Tezlik:** LCP < 2.5s, CLS < 0.1, INP < 200ms (mobil 4G'da). Rasmlar lazy-load,
   shriftlar `font-display: swap`.

## 7. SEO — Google Discover

Discover'ga "ariza topshirish" yo'q — u algoritmik. Shartlar:

- [x] `robots` meta: `max-image-preview:large` (barcha sahifalarda).
- [x] Muqova rasmlari **1200px+ keng**, 16:9 va 4:3 nisbatda.
- [x] `Article` strukturaviy ma'lumoti to'liq (sana, muallif, rasm).
- [x] Mobilga to'liq moslashgan, tez ochiladigan sahifalar.
- [x] Muallif sahifasi: ism, foto, tajriba (E-E-A-T).
- [x] Discover kontent siyosatiga rioya: aldov, clickbait, "sirli usullar" yo'q.
- [x] Yangi kontent muntazam — haftada 2–3 ta maqola.
- [x] `News sitemap` (agar tez yangiliklar bo'lsa) — majburiy emas, foydali.
- [x] `og:image`, `twitter:card` — ijtimoiy tarmoqlarda chiroyli ko'rinish.

Eslatma: Discover traffic **barqaror emas** — bir kunda 10 ming, keyin 200 bo'lishi
mumkin. Shuning uchun e'lonlar (Search) va maqolalar (Discover) ikkalasi ham kerak.

## 8. Admin panel

- Kirish: email + parol (keyin 2FA).
- E'lon qo'shish: forma + rasm yuklash + xaritada joy belgilash.
- Qoralama → nashr qilish, sotilgan deb belgilash.
- Maqola yozish: Markdown/MDX muharriri, muqova rasm, kategoriya.
- Statistika: ko'rishlar, qo'ng'iroqlar, qaysi e'lon ko'p qiziqish uyg'otdi.
- Lead'lar ro'yxati: ism, telefon, qaysi e'lon, sana.

## 9. Ish bosqichlari

| Bosqich | Ish | Muddat |
|---|---|---|
| **1** | Poydevor: GitHub repo, Next.js, DB, domen, deploy, dizayn skeleti | 3–5 kun |
| **2** | Ma'lumot modeli, admin panel, rasm yuklash va optimizatsiya | 1–2 hafta |
| **3** | Ommaviy qism: bosh sahifa, filtrlar, e'lon sahifasi, xarita, aloqa formasi | 1–2 hafta |
| **4** | SEO texnik: sitemap, robots, JSON-LD, metadata, Search Console | 3–5 kun |
| **5** | Blog bo'limi + dastlabki 10–15 maqola | 1–2 hafta |
| **6** | Analitika (GA4, Search Console, Clarity), GitHub Actions CI, test, ishga tushirish | 2–3 kun |

**MVP jami: ~6–8 hafta.** Birinchi foydali versiya (e'lonlar + admin) — 3-haftada.

Keyin doimiy: haftada 2–3 maqola, oyiga 1 marta natijalarni tahlil qilish.

## 10. Xarajatlar (taxminiy, oyiga)

| Xizmat | Narx |
|---|---|
| Domen (.uz yoki .com) | ~$10–15 / yil |
| Vercel hosting | $0 (bepul tarif) → $20 (Pro) |
| PostgreSQL (Neon/Supabase) | $0 → $25 |
| Rasm saqlash (R2/S3) | $1–5 |
| CDN (Cloudflare) | $0 |
| **Jami boshlanish** | **~$0–10 / oy** |

Rasmlar ko'payganda saqlash va trafik xarajati oshadi — buni kuzatib borish kerak.

## 11. Yuridik

- Maxfiylik siyosati va cookie rozilik banneri (Google talabi).
- Foydalanuvchi telefon raqamlari — shaxsiy ma'lumot, himoyalangan saqlash.
- E'lonlarda "vositachi" ekanligi ko'rsatilishi (agar siz vositachi bo'lsangiz).
- Mualliflik: rasmlar o'zingizniki bo'lishi yoki ruxsat olingan bo'lishi shart.

## 12. GitHub'da kod yuritish

Kod GitHub'da saqlanadi, har o'zgarish commit qilib boriladi.

**Repo:** `github.com/<username>/uy-joy` — **private** (boshlang'ich davrda), keyin
kerak bo'lsa public.

**Branch strategiyasi:**
```
main      — doim ishlaydigan, serverga chiqadigan versiya
 dev      — kundalik ishlar
feature/* — yangi funksiya (masalan: feature/rasm-yuklash)
```

**Ish tartibi:**
1. `dev` dan branch ochish → o'zgarish → commit → push.
2. Pull Request → GitHub Actions testlarni yurgizadi (lint, typecheck, build).
3. Yashil bo'lsa `dev` ga merge, hafta oxirida `dev` → `main`.

**Commit xabari:** `feat: e'lon qo'shish formasi`, `fix: rasm yuklashda xato`,
`seo: sitemap qo'shildi` — o'zgarishning maqsadini yozish.

**GitHub Actions (`.github/workflows/ci.yml`):**
- Har push/PR da: `npm ci` → `lint` → `typecheck` → `build`.
- `main` ga merge bo'lganda Vercel avtomatik deploy qiladi (Git integratsiyasi).

**Maxfiy kalitlar hech qachon kodga yozilmaydi:**
- `.env.local` — `.gitignore` da, faqat lokal.
- Production kalitlar: Vercel Environment Variables + GitHub Secrets.
- Repo'da faqat `.env.example` (kalitlarsiz namuna) turadi.

**Foydali:** `README.md` — loyihani o'rnatish va ishga tushirish yo'riqnomasi;
`git tag` bilan versiyalar (`v1.0.0` — birinchi nashr).
