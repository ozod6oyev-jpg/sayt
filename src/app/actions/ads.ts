"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import {
  checkAdAccount,
  minorUnitFactor,
  normalizeAdAccountId,
  saveAdsSettings,
  setAdSetBudget,
  setObjectStatus,
  type AdObjective,
} from "@/lib/meta-ads";
import { createTarget, setTargetStatus } from "@/lib/ads-targets";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function list(formData: FormData, key: string): string[] {
  return formData.getAll(key).map((value) => (typeof value === "string" ? value.trim() : ""));
}

function number(formData: FormData, key: string, fallback: number): number {
  const parsed = Number(text(formData, key).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

const BACK = "/admin/reklama";
const withStatus = (key: string, value: string) => `${BACK}?${key}=${value}`;

function backTo(raw: string): string {
  return raw.startsWith("/admin/reklama") ? raw : BACK;
}

function withFlag(back: string, key: string, value: string): string {
  return `${back}${back.includes("?") ? "&" : "?"}${key}=${value}`;
}

/** Boshqa ad accountni tanlash */
export async function selectAdAccount(formData: FormData): Promise<void> {
  await requireOwner();

  const adAccountId = normalizeAdAccountId(text(formData, "adAccountId"));
  if (!adAccountId) redirect(withStatus("ads", "invalid"));

  await saveAdsSettings({ adAccountId, adsToken: "" });

  revalidatePath(BACK);
  redirect(withStatus("account", "saved"));
}

/** Kampaniya, ad set yoki e'lonni yoqish/pauza qilish */
export async function toggleAdStatus(formData: FormData): Promise<void> {
  await requireOwner();

  const id = text(formData, "id");
  const status = text(formData, "status") === "ACTIVE" ? "ACTIVE" : "PAUSED";
  const back = backTo(text(formData, "returnTo"));

  if (!id) redirect(withFlag(back, "holat", "invalid"));

  const result = await setObjectStatus(id, status);

  revalidatePath(BACK);
  revalidatePath(`${BACK}/kampaniya/${text(formData, "campaignId")}`);
  redirect(withFlag(back, "holat", result.ok ? "ok" : "error"));
}

/** Ad setning kunlik byudjetini saqlash */
export async function updateAdSetBudget(formData: FormData): Promise<void> {
  await requireOwner();

  const id = text(formData, "id");
  const value = number(formData, "budget", 0);
  const currencyValue = text(formData, "currency").toUpperCase();
  const currency = /^[A-Z]{3}$/.test(currencyValue) ? currencyValue : "USD";
  const back = backTo(text(formData, "returnTo"));

  if (!id || value < 1) redirect(withFlag(back, "holat", "invalid"));

  const result = await setAdSetBudget(id, value * minorUnitFactor(currency));

  revalidatePath(BACK);
  redirect(withFlag(back, "holat", result.ok ? "budget" : "error"));
}

/** Ad account ID va Marketing API tokenini saqlash */
export async function saveMetaAdsSettings(formData: FormData): Promise<void> {
  await requireOwner();

  const adAccountId = normalizeAdAccountId(text(formData, "adAccountId"));
  const adsToken = text(formData, "adsToken");

  if (!adAccountId) {
    redirect(withStatus("ads", "invalid"));
  }

  await saveAdsSettings({ adAccountId, adsToken });

  revalidatePath(BACK);
  redirect(withStatus("ads", "saved"));
}

/** Ad account ulanishini tekshirish */
export async function testMetaAdsConnection(): Promise<void> {
  await requireOwner();

  const result = await checkAdAccount();
  revalidatePath(BACK);
  redirect(withStatus("adsCheck", result.ok ? "ok" : "error"));
}

const OBJECTIVES: AdObjective[] = ["OUTCOME_TRAFFIC", "OUTCOME_AWARENESS", "OUTCOME_ENGAGEMENT"];
const CATEGORIES = ["housing", "finance", "leads", "assets"];

/** Meta'da yangi reklama kampaniyasi yaratish (standart holat — pauzada) */
export async function createMetaAdCampaign(formData: FormData): Promise<void> {
  await requireOwner();

  const name = text(formData, "name").slice(0, 120);
  const objectiveValue = text(formData, "objective") as AdObjective;
  const objective = OBJECTIVES.includes(objectiveValue) ? objectiveValue : "OUTCOME_TRAFFIC";
  const categoryValue = text(formData, "category");
  const category = CATEGORIES.includes(categoryValue) ? categoryValue : "housing";
  const budget = number(formData, "budget", 0);
  const days = Math.round(number(formData, "days", 7));
  const ageMin = Math.round(number(formData, "ageMin", 18));
  const ageMax = Math.round(number(formData, "ageMax", 55));
  const genderValue = text(formData, "gender");
  const gender = genderValue === "male" || genderValue === "female" ? genderValue : "all";
  const videos = list(formData, "video").slice(0, 3);
  const thumbnails = list(formData, "videoThumb").slice(0, 3);
  const listingIds = list(formData, "listingId").slice(0, 3);
  const headlines = list(formData, "headline").slice(0, 3);
  const messages = list(formData, "message").slice(0, 3);
  const links = list(formData, "link").slice(0, 3);
  const ctaValue = text(formData, "cta");
  const cta = /^[A-Z_]{3,40}$/.test(ctaValue) ? ctaValue : "LEARN_MORE";
  const active = text(formData, "active") === "1";

  if (
    name.length < 3 ||
    budget < 1 ||
    budget > 10_000 ||
    days < 1 ||
    days > 90 ||
    ageMin < 18 ||
    ageMax > 65 ||
    ageMin > ageMax ||
    videos.length !== 3 ||
    thumbnails.length !== 3 ||
    headlines.length !== 3 ||
    messages.length !== 3 ||
    links.length !== 3 ||
    videos.some((url) => !url.startsWith("/uploads/") && !/^https?:\/\//i.test(url)) ||
    thumbnails.some((url) => !url.startsWith("/uploads/") && !/^https?:\/\//i.test(url)) ||
    links.some((url) => !/^https?:\/\//i.test(url)) ||
    messages.some((value) => value.length < 5) ||
    headlines.some((value) => value.length < 3)
  ) {
    redirect(withStatus("ad", "invalid"));
  }

  // Meta videoni tashqaridan yuklab olishi uchun to'liq manzil kerak
  const publicBase = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const absolute = (url: string) => (url.startsWith("/") ? `${publicBase}${url}` : url);

  // Har bir Reels — o'z e'loni bilan (e'lon, matn va havola alohida)
  const creatives = videos.map((url, index) => ({
    listingId: listingIds[index] ?? "",
    video: absolute(url),
    thumbnail: absolute(thumbnails[index]),
    headline: headlines[index].slice(0, 100),
    message: messages[index].slice(0, 500),
    link: links[index],
    cta,
  }));

  const currencyValue = text(formData, "currency").toUpperCase();
  const currency = /^[A-Z]{3}$/.test(currencyValue) ? currencyValue : "USD";

  // Hozircha Meta'ga yuborilmaydi: lokal target yaratiladi, jami byudjet
  // «Kutilayotgan sarf»ga o'tadi. Keyinchalik real Ads API ulanadi.
  await createTarget({
    name,
    objective,
    dailyBudget: Math.round(budget * minorUnitFactor(currency)),
    days,
    videos: creatives.length,
    currency,
    active,
    category,
    creatives,
  });

  revalidatePath(BACK);
  redirect(withStatus("ad", "created"));
}

/** Targetni yoqish/pauza — hozircha faqat panelda (feyk) */
export async function toggleAdTarget(formData: FormData): Promise<void> {
  await requireOwner();

  const id = text(formData, "id");
  const active = text(formData, "status") === "ACTIVE";
  const back = backTo(text(formData, "returnTo"));

  if (!id) redirect(withFlag(back, "holat", "invalid"));

  await setTargetStatus(id, active);

  revalidatePath(BACK);
  redirect(withFlag(back, "holat", "ok"));
}
