/** Jami reklama byudjetidan ushlanadigan soliq (2%) */
export const BUDGET_TAX_RATE = 0.02;

/**
 * Jami byudjet → soliq (2%) → targetga ketadigan aniq summa.
 * Summalar ad accountning eng kichik birligida (masalan sentda) bo'lishi mumkin.
 */
export function splitBudget(gross: number): { gross: number; tax: number; net: number } {
  const safeGross = Math.max(Math.round(gross), 0);
  const tax = Math.round(safeGross * BUDGET_TAX_RATE);

  return { gross: safeGross, tax, net: safeGross - tax };
}

/**
 * O'zbekiston bo'yicha Meta (FB + IG, "saytga o'tish", video) o'rtacha ko'rsatkichlari.
 * Meta statistikani hali bermagan (tekshiruvdagi) targetlar uchun taxminiy hisob.
 */
export const META_BENCHMARK = {
  /** 1000 ko'rsatish narxi, USD */
  cpm: 1.3,
  /** Bosishlar ulushi, % */
  ctr: 1.4,
  /** Bir odamga o'rtacha ko'rsatishlar soni */
  frequency: 1.6,
};

export type Benchmark = typeof META_BENCHMARK;

export type Delivery = { impressions: number; clicks: number; reach: number };

/** Sarflangan summadan (USD) taxminiy ko'rsatishlar, bosishlar va qamrov */
export function estimateDelivery(spendUsd: number, benchmark: Benchmark = META_BENCHMARK): Delivery {
  if (spendUsd <= 0) return { impressions: 0, clicks: 0, reach: 0 };

  const impressions = Math.round((spendUsd / benchmark.cpm) * 1000);

  return {
    impressions,
    clicks: Math.round(impressions * (benchmark.ctr / 100)),
    reach: Math.round(impressions / benchmark.frequency),
  };
}
