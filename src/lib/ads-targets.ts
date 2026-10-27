import { randomUUID } from "crypto";
import { splitBudget } from "./ads-budget";
import { prisma } from "./prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Hamyon so'mda to'lanadi, reklama esa dollarda ketadi — shu qat'iy kurs bo'yicha o'giriladi */
export const UZS_PER_USD = 11_896;

export type AdsWallet = {
  /** To'langan summa (so'm) */
  uzs: number;
  /** To'langan summaning dollar ekvivalenti (solig'siz) */
  usd: number;
  /** 2% soliq — faqat target yoqilganda ajratiladi */
  taxUsd: number;
  /** Soliq allaqachon ajratilganmi */
  taxCharged: boolean;
};

/** Reklama hamyoni: masalan 1 189 600 so'm → 100 USD (solig'i target yoqilganda ajratiladi) */
export async function getAdsWallet(): Promise<AdsWallet> {
  const row = await prisma.metaIntegration.findUnique({
    where: { id: "default" },
    select: { adsBudgetUzs: true, adsTaxChargedAt: true },
  });

  const uzs = row?.adsBudgetUzs ?? 0;
  const { gross, tax } = splitBudget(Math.round((uzs / UZS_PER_USD) * 100));

  return {
    uzs,
    usd: gross / 100,
    taxUsd: tax / 100,
    taxCharged: Boolean(row?.adsTaxChargedAt),
  };
}

/** Soliq hamyondan bir marta ajratiladi — target birinchi marta yoqilganda */
export async function chargeWalletTax(): Promise<void> {
  await prisma.metaIntegration.updateMany({
    where: { id: "default", adsTaxChargedAt: null },
    data: { adsTaxChargedAt: new Date() },
  });
}

/** Saqlangan Reels sozlamasi (har bir video uchun alohida e'lon) */
export type AdCreative = {
  listingId: string;
  video: string;
  thumbnail: string;
  headline: string;
  message: string;
  link: string;
  cta: string;
};

export type AdTarget = {
  id: string;
  name: string;
  objective: string;
  category: string | null;
  active: boolean;
  dailyBudget: number;
  totalBudget: number;
  spentAmount: number;
  pendingAmount: number;
  days: number;
  videos: number;
  currency: string;
  creatives: AdCreative[];
  createdAt: Date;
};

function parseCreatives(raw: string | null): AdCreative[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        listingId: typeof item.listingId === "string" ? item.listingId : "",
        video: typeof item.video === "string" ? item.video : "",
        thumbnail: typeof item.thumbnail === "string" ? item.thumbnail : "",
        headline: typeof item.headline === "string" ? item.headline : "",
        message: typeof item.message === "string" ? item.message : "",
        link: typeof item.link === "string" ? item.link : "",
        cta: typeof item.cta === "string" ? item.cta : "",
      }));
  } catch {
    return [];
  }
}

/**
 * Faol targetlardan o'tgan to'liq kunlar uchun kunlik byudjetni «sarflandi»ga
 * o'tkazadi va hisob nuqtasini oldinga suradi. Kechagi kunlar yo'qolmaydi.
 */
export async function settleTargets(): Promise<void> {
  const active = await prisma.metaAd.findMany({
    where: { status: "ACTIVE", startedAt: { not: null } },
    select: {
      id: true,
      dailyBudget: true,
      totalBudget: true,
      days: true,
      startedAt: true,
      chargedDays: true,
    },
  });

  const updates = active.flatMap((target) => {
    if (!target.startedAt) return [];

    const elapsed = Math.floor((Date.now() - target.startedAt.getTime()) / DAY_MS);
    const remainingDays = Math.max((target.days ?? 0) - target.chargedDays, 0);
    const charge = Math.min(elapsed, remainingDays);

    if (charge <= 0) return [];

    return [
      prisma.metaAd.update({
        where: { id: target.id },
        data: {
          chargedDays: { increment: charge },
          spentAmount: { increment: charge * target.dailyBudget },
          startedAt: new Date(target.startedAt.getTime() + charge * DAY_MS),
        },
      }),
    ];
  });

  if (updates.length > 0) await Promise.all(updates);
}

/** Lokal targetlar ro'yxati (yangi avval) — byudjet holati bilan */
export async function listTargets(): Promise<AdTarget[]> {
  await settleTargets();

  const rows = await prisma.metaAd.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

  return rows.map((row) => {
    const total = row.totalBudget ?? row.dailyBudget * (row.days ?? 0);
    const spent = Math.min(row.spentAmount, total);

    return {
      id: row.id,
      name: row.name,
      objective: row.objective,
      category: row.category,
      active: row.status === "ACTIVE",
      dailyBudget: row.dailyBudget,
      totalBudget: total,
      spentAmount: spent,
      pendingAmount: Math.max(total - spent, 0),
      days: row.days ?? 0,
      videos: row.videos,
      currency: row.currency,
      creatives: parseCreatives(row.creatives),
      createdAt: row.createdAt,
    };
  });
}

/** Yangi lokal target: jami byudjet darhol «kutilayotgan sarf»ga o'tadi */
export async function createTarget(input: {
  name: string;
  objective: string;
  dailyBudget: number;
  days: number;
  videos: number;
  currency: string;
  active: boolean;
  category?: string;
  creatives?: unknown;
}): Promise<{ id: string }> {
  // Jami byudjetdan 2% soliq ushlanadi — targetga faqat qolgan summa ketadi
  const grossDaily = input.dailyBudget;
  const { net } = splitBudget(grossDaily * input.days);
  const netDaily = Math.round(net / input.days);
  const totalBudget = net;

  const row = await prisma.metaAd.create({
    data: {
      campaignId: `local-${randomUUID()}`,
      name: input.name,
      objective: input.objective,
      status: input.active ? "ACTIVE" : "PAUSED",
      dailyBudget: netDaily,
      totalBudget,
      days: input.days,
      videos: input.videos,
      creatives: input.creatives ? JSON.stringify(input.creatives) : null,
      category: input.category ?? null,
      currency: input.currency,
      startedAt: input.active ? new Date() : null,
    },
  });

  // Darhol yoqilgan bo'lsa, soliq ham shu paytda ajratiladi
  if (input.active) await chargeWalletTax();

  return { id: row.id };
}

/** Targetni yoqish/pauza qilish (hozircha faqat panelda — Meta'ga yuborilmaydi) */
export async function setTargetStatus(id: string, active: boolean): Promise<void> {
  await settleTargets();

  const target = await prisma.metaAd.findUnique({
    where: { id },
    select: { startedAt: true },
  });

  if (!target) return;

  await prisma.metaAd.update({
    where: { id },
    data: active
      ? { status: "ACTIVE", startedAt: target.startedAt ?? new Date() }
      : { status: "PAUSED" },
  });

  // Target yoqildi — hamyondan 2% soliq ajratiladi (bir marta)
  if (active) await chargeWalletTax();
}
