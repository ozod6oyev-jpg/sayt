# UyJoy — uy-joy sotish sayti

O'zbekiston bo'ylab uy-joy e'lonlari platformasi. E'lonlar va rasmlar, ikki tilli
(o'zbekcha/ruscha) sayt, admin panel, blog va Google Search / Discover uchun SEO.

## Texnologiyalar

- **Next.js 15** (App Router, React 19, TypeScript)
- **PostgreSQL yoki SQLite** + **Prisma 6**
- **Tailwind CSS v4**
- **sharp** — rasmlarni WebP ga o'girish va optimallashtirish

## Lokal ishga tushirish

```bash
npm install
cp .env.example .env        # qiymatlarni o'zgartiring
npx prisma db push          # bazani yaratish
npm run db:seed             # demo e'lonlar va maqolalar
npm run dev                 # http://localhost:3000
```

### Muhit o'zgaruvchilari (`.env`)

| O'zgaruvchi | Ma'nosi |
|---|---|
| `DATABASE_URL` | `file:./dev.db` (SQLite) yoki Postgres ulanish satri |
| `ADMIN_PASSWORD` | Admin panel paroli |
| `SESSION_SECRET` | Cookie imzosi uchun tasodifiy satr |
| `NEXT_PUBLIC_SITE_URL` | Saytning to'liq manzili (sitemap, OG uchun) |

`.env` **hech qachon** GitHub'ga yuklanmaydi. Repoda faqat `.env.example` turadi.

## Admin panel

- Manzil: `/kirish`
- Parol: `.env` dagi `ADMIN_PASSWORD`
- Imkoniyatlar: e'lon qo'shish/tahrirlash/o'chirish, bir nechta rasm yuklash,
  qoralama/faol/sotilgan holati, maqola yozish va nashr qilish, kelgan so'rovlar.

Yuklangan rasmlar `uploads/` papkasida saqlanadi va `/uploads/<fayl>` route orqali
beriladi (papka `.gitignore` da).

## Sahifalar

```
/uz, /ru                     Bosh sahifa
/uz/elonlar                  Filtrli e'lonlar ro'yxati
/uz/elonlar/[slug]           E'lon sahifasi (galereya, xarita, so'rov formasi)
/uz/blog, /uz/blog/[slug]    Maqolalar (Discover uchun)
/uz/aloqa, /uz/maxfiylik     Statik sahifalar
/admin, /kirish              Boshqaruv paneli
/sitemap.xml, /robots.txt    SEO fayllari
```

Til prefiksi bo'lmagan har qanday yo'l (`/`, `/elonlar`) middleware orqali
`/uz/...` ga yo'naltiriladi.

## SEO (Google Search + Discover)

- Server-side rendering — har sahifa to'liq HTML.
- Har sahifa uchun `canonical` va `hreflang` (uz/ru/x-default).
- `max-image-preview:large` — Discover uchun majburiy sozlama.
- JSON-LD: `RealEstateListing` + `Offer`, `Article`, `BreadcrumbList`, `WebSite`.
- Dinamik `sitemap.xml` (e'lonlar va maqolalar bilan) va `robots.txt`.
- Rasm yuklashda: WebP, maksimal 1920px, EXIF tozalanadi.
- Maqola muqovasi: 1200px+ kenglik tavsiya etiladi.

Ishga tushirgandan keyin:
1. [Google Search Console](https://search.google.com/search-console) da domenni tasdiqlang.
2. `sitemap.xml` ni yuboring.
3. `Rich Results Test` bilan e'lon va maqola sahifalarini tekshiring.
4. Discover uchun haftada 2–3 ta original maqola nashr eting.

## GitHub

```bash
git init
git add .
git commit -m "feat: UyJoy sayti MVP"
git branch -M main
git remote add origin git@github.com:<username>/uy-joy.git
git push -u origin main
```

Branchlar: `main` (ishlaydigan versiya), `dev` (kundalik ishlar), `feature/*`.
Har bir o'zgarish Pull Request orqali. `main` ga push bo'lganda Vercel avtomatik
deploy qiladi (repo'ni Vercel'ga ulang).

## Vercel'ga deploy

1. Repo'ni Vercel'ga import qiling.
2. Environment Variables: `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`,
   `NEXT_PUBLIC_SITE_URL`.
3. Build command: `npm run build` (ichida `prisma generate` bor).
4. `npx prisma db push` ni bazaga bir marta qo'lda yurgizing.

**Muhim:** Vercel'da fayl tizimi doimiy emas — rasmlar `uploads/` papkasida
qolmaydi. Production uchun S3-mos saqlash (Cloudflare R2 / Supabase Storage)
kerak. Buning uchun faqat `src/lib/uploads.ts` dagi `saveImage` ni almashtirish
yetarli: u `{ url, width, height }` qaytarishi kerak.

## Postgres'ga o'tish

1. `prisma/schema.prisma` da `provider = "sqlite"` → `"postgresql"`.
2. `.env` da `DATABASE_URL` ni Postgres satriga o'zgartiring.
3. `npx prisma db push` va `npm run db:seed`.

## Foydali buyruqlar

```bash
npm run dev        # dev server
npm run build      # production build (prisma generate + next build)
npm start          # production server
npm run db:push    # sxemani bazaga qo'llash
npm run db:seed    # demo ma'lumotlar
npm run db:studio  # Prisma Studio
```

Batafsil reja: [REJA.md](REJA.md)
