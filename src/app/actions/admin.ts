"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/uploads";

const LISTING_STATUSES = ["draft", "active", "sold"] as const;
const LISTING_TYPES = ["sale", "rent"] as const;
const PROPERTY_TYPES = ["apartment", "house", "land", "commercial"] as const;
const ARTICLE_CATEGORIES = ["bozor", "qollanma", "ipoteka", "tahlil"] as const;

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                        */
/* ------------------------------------------------------------------ */

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function intOrNull(formData: FormData, key: string): number | null {
  const raw = text(formData, key).replace(/\s/g, "");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function floatOrNull(formData: FormData, key: string): number | null {
  const raw = text(formData, key).replace(/\s/g, "").replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function bigIntOrNull(formData: FormData, key: string): bigint | null {
  const digits = text(formData, key).replace(/[^\d]/g, "");
  if (!digits) return null;
  try {
    return BigInt(digits);
  } catch {
    return null;
  }
}

const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "x",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ў: "o",
  қ: "q",
  ғ: "g",
  ҳ: "h",
};

function slugify(input: string): string {
  const lower = input.toLowerCase().replace(/[ʻʼ’'`‘]/g, "");
  const transliterated = lower
    .split("")
    .map((char) => CYRILLIC[char] ?? char)
    .join("");

  const slug = transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return slug || "elon";
}

async function uniqueListingSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let counter = 1;

  while (
    await prisma.listing.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    counter += 1;
    candidate = `${root}-${counter}`;
  }

  return candidate;
}

async function uniqueArticleSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let counter = 1;

  while (
    await prisma.article.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    counter += 1;
    candidate = `${root}-${counter}`;
  }

  return candidate;
}

function revalidatePublic(extraPaths: string[] = []): void {
  for (const path of extraPaths) {
    revalidatePath(path);
  }
  revalidatePath("/uz");
  revalidatePath("/ru");
  revalidatePath("/uz/elonlar");
  revalidatePath("/ru/elonlar");
}

async function uploadListingPhotos(
  listingId: string,
  formData: FormData,
  startSort: number,
  altBase: string,
): Promise<void> {
  const entries = formData.getAll("photos");
  let sort = startSort;
  let index = 0;

  for (const entry of entries) {
    if (!(entry instanceof File) || entry.size === 0) continue;

    try {
      const saved = await saveImage(entry);
      index += 1;
      await prisma.photo.create({
        data: {
          listingId,
          url: saved.url,
          width: saved.width,
          height: saved.height,
          alt: `${altBase} — ${index}`,
          sort: sort,
        },
      });
      sort += 1;
    } catch (error) {
      console.error("Rasm yuklanmadi:", error);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Kirish / chiqish                                                    */
/* ------------------------------------------------------------------ */

export async function login(formData: FormData): Promise<void> {
  const password = text(formData, "password");

  if (!checkPassword(password)) {
    redirect("/kirish?error=1");
  }

  await createSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/kirish");
}

/* ------------------------------------------------------------------ */
/* E'lonlar                                                            */
/* ------------------------------------------------------------------ */

type ListingData = {
  titleUz: string;
  titleRu: string;
  descriptionUz: string;
  descriptionRu: string;
  type: string;
  propertyType: string;
  price: bigint;
  currency: string;
  rooms: number | null;
  area: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  condition: string | null;
  region: string;
  district: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  status: string;
};

function parseListing(formData: FormData): { error: string } | { data: ListingData } {
  const titleUz = text(formData, "titleUz");
  const titleRu = text(formData, "titleRu");
  const region = text(formData, "region");
  const district = text(formData, "district");
  const address = text(formData, "address");
  const phone = text(formData, "phone");
  const price = bigIntOrNull(formData, "price");

  if (!titleUz || !titleRu || !region || !district || !address || !phone) {
    return { error: "required" };
  }

  if (price === null) {
    return { error: "price" };
  }

  return {
    data: {
      titleUz,
      titleRu,
      descriptionUz: text(formData, "descriptionUz"),
      descriptionRu: text(formData, "descriptionRu"),
      type: oneOf(text(formData, "type"), LISTING_TYPES, "sale"),
      propertyType: oneOf(text(formData, "propertyType"), PROPERTY_TYPES, "apartment"),
      price,
      currency: oneOf(text(formData, "currency"), ["USD", "UZS"] as const, "USD"),
      rooms: intOrNull(formData, "rooms"),
      area: intOrNull(formData, "area"),
      floor: intOrNull(formData, "floor"),
      totalFloors: intOrNull(formData, "totalFloors"),
      yearBuilt: intOrNull(formData, "yearBuilt"),
      condition: text(formData, "condition") || null,
      region,
      district,
      address,
      lat: floatOrNull(formData, "lat"),
      lng: floatOrNull(formData, "lng"),
      phone,
      status: oneOf(text(formData, "status"), LISTING_STATUSES, "draft"),
    },
  };
}

export async function createListing(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = parseListing(formData);
  if ("error" in parsed) {
    redirect(`/admin/listings/new?error=${parsed.error}`);
  }

  const slug = await uniqueListingSlug(text(formData, "slug") || parsed.data.titleUz);

  const listing = await prisma.listing.create({
    data: { ...parsed.data, slug },
  });

  await uploadListingPhotos(listing.id, formData, 0, parsed.data.titleUz);

  revalidatePublic();
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  redirect("/admin/listings");
}

export async function updateListing(id: string, formData: FormData): Promise<void> {
  await requireAdmin();

  const existing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });

  if (!existing) {
    redirect("/admin/listings");
  }

  const parsed = parseListing(formData);
  if ("error" in parsed) {
    redirect(`/admin/listings/${id}?error=${parsed.error}`);
  }

  const requestedSlug = text(formData, "slug");
  const slug = requestedSlug
    ? await uniqueListingSlug(requestedSlug, id)
    : existing.slug;

  await prisma.listing.update({
    where: { id },
    data: { ...parsed.data, slug },
  });

  const max = await prisma.photo.aggregate({
    where: { listingId: id },
    _max: { sort: true },
  });

  await uploadListingPhotos(id, formData, (max._max.sort ?? -1) + 1, parsed.data.titleUz);

  revalidatePublic([`/uz/elonlar/${slug}`, `/ru/elonlar/${slug}`]);
  revalidatePath("/admin/listings");
  redirect(`/admin/listings/${id}?saved=1`);
}

export async function deleteListing(id: string): Promise<void> {
  await requireAdmin();

  await prisma.listing.delete({ where: { id } });

  revalidatePublic();
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  redirect("/admin/listings");
}

export async function addListingPhotos(id: string, formData: FormData): Promise<void> {
  await requireAdmin();

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, titleUz: true, slug: true },
  });

  if (!listing) {
    redirect("/admin/listings");
  }

  const max = await prisma.photo.aggregate({
    where: { listingId: id },
    _max: { sort: true },
  });

  await uploadListingPhotos(id, formData, (max._max.sort ?? -1) + 1, listing.titleUz);

  revalidatePublic([`/uz/elonlar/${listing.slug}`, `/ru/elonlar/${listing.slug}`]);
  redirect(`/admin/listings/${id}?saved=photos`);
}

export async function deletePhoto(photoId: string, listingId: string): Promise<void> {
  await requireAdmin();

  await prisma.photo.delete({ where: { id: photoId } }).catch(() => null);

  revalidatePublic();
  redirect(`/admin/listings/${listingId}?saved=photos`);
}

/* ------------------------------------------------------------------ */
/* Maqolalar                                                           */
/* ------------------------------------------------------------------ */

type ArticleData = {
  titleUz: string;
  titleRu: string;
  excerptUz: string;
  excerptRu: string;
  bodyUz: string;
  bodyRu: string;
  category: string;
  authorName: string;
  authorRole: string;
  published: boolean;
  publishedAt: Date;
};

function parseArticleDate(formData: FormData): Date {
  const raw = text(formData, "publishedAt");
  if (!raw) return new Date();

  const parsed = new Date(`${raw}T09:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseArticle(formData: FormData): { error: string } | { data: ArticleData } {
  const titleUz = text(formData, "titleUz");
  const titleRu = text(formData, "titleRu");
  const authorName = text(formData, "authorName");

  if (!titleUz || !titleRu || !authorName) {
    return { error: "required" };
  }

  return {
    data: {
      titleUz,
      titleRu,
      excerptUz: text(formData, "excerptUz"),
      excerptRu: text(formData, "excerptRu"),
      bodyUz: text(formData, "bodyUz"),
      bodyRu: text(formData, "bodyRu"),
      category: oneOf(text(formData, "category"), ARTICLE_CATEGORIES, "qollanma"),
      authorName,
      authorRole: text(formData, "authorRole"),
      published: formData.get("published") !== null,
      publishedAt: parseArticleDate(formData),
    },
  };
}

export async function createArticle(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = parseArticle(formData);
  if ("error" in parsed) {
    redirect(`/admin/articles/new?error=${parsed.error}`);
  }

  const cover = formData.get("cover");
  if (!(cover instanceof File) || cover.size === 0) {
    redirect("/admin/articles/new?error=cover");
  }

  const saved = await saveImage(cover);
  const slug = await uniqueArticleSlug(text(formData, "slug") || parsed.data.titleUz);

  await prisma.article.create({
    data: {
      ...parsed.data,
      slug,
      coverImage: saved.url,
      coverWidth: saved.width,
      coverHeight: saved.height,
    },
  });

  revalidatePublic(["/uz/blog", "/ru/blog"]);
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}

export async function updateArticle(id: string, formData: FormData): Promise<void> {
  await requireAdmin();

  const existing = await prisma.article.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });

  if (!existing) {
    redirect("/admin/articles");
  }

  const parsed = parseArticle(formData);
  if ("error" in parsed) {
    redirect(`/admin/articles/${id}?error=${parsed.error}`);
  }

  const requestedSlug = text(formData, "slug");
  const slug = requestedSlug
    ? await uniqueArticleSlug(requestedSlug, id)
    : existing.slug;

  const cover = formData.get("cover");
  let coverData: { url: string; width: number; height: number } | null = null;

  if (cover instanceof File && cover.size > 0) {
    coverData = await saveImage(cover);
  }

  await prisma.article.update({
    where: { id },
    data: {
      ...parsed.data,
      slug,
      ...(coverData
        ? {
            coverImage: coverData.url,
            coverWidth: coverData.width,
            coverHeight: coverData.height,
          }
        : {}),
    },
  });

  revalidatePublic([
    "/uz/blog",
    "/ru/blog",
    `/uz/blog/${existing.slug}`,
    `/ru/blog/${existing.slug}`,
    `/uz/blog/${slug}`,
    `/ru/blog/${slug}`,
  ]);
  revalidatePath("/admin/articles");
  redirect(`/admin/articles/${id}?saved=1`);
}

export async function deleteArticle(id: string): Promise<void> {
  await requireAdmin();

  await prisma.article.delete({ where: { id } });

  revalidatePublic(["/uz/blog", "/ru/blog"]);
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}

export async function toggleArticlePublished(id: string): Promise<void> {
  await requireAdmin();

  const article = await prisma.article.findUnique({
    where: { id },
    select: { published: true },
  });

  if (article) {
    await prisma.article.update({
      where: { id },
      data: { published: !article.published },
    });
  }

  revalidatePublic(["/uz/blog", "/ru/blog"]);
  redirect("/admin/articles");
}
