import { estimateDelivery, type Benchmark, type Delivery } from "./ads-budget";
import type { AdCreative, AdTarget } from "./ads-targets";

export type Reel = {
  key: string;
  creative: AdCreative;
  target: AdTarget;
  /** Shu videoga to'g'ri keladigan sarf (valyutada) */
  spent: number;
  stats: Delivery;
};

/** Jami sarf videolar orasida shu nisbatda bo'linadi (tartib bo'yicha, ko'p bo'lsa takrorlanadi) */
const SPEND_WEIGHTS = [8.5, 18.4, 12.3];

/** Har bir video uchun bir-biriga yaqin, lekin bir xil bo'lmagan ko'rsatkichlar */
const REEL_BENCHMARKS: Benchmark[] = [
  { cpm: 1.34, ctr: 1.36, frequency: 1.58 },
  { cpm: 1.27, ctr: 1.44, frequency: 1.63 },
  { cpm: 1.31, ctr: 1.39, frequency: 1.6 },
];

/**
 * Targetlardagi videolar ro'yxati: bir xil video takrorlanmaydi, targetlarning
 * jami sarfi videolarga bo'linadi va har biriga taxminiy statistika hisoblanadi.
 */
export function buildReels(targets: AdTarget[], factor: number): Reel[] {
  const items: Omit<Reel, "spent" | "stats">[] = [];
  const seen = new Set<string>();
  for (const target of targets) {
    for (const creative of target.creatives) {
      const key = creative.video || `${creative.headline}|${creative.link}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ key, creative, target });
    }
  }

  const totalCents = Math.round(targets.reduce((sum, target) => sum + target.spentAmount, 0) / factor * 100);
  const weights = items.map((_, index) => SPEND_WEIGHTS[index % SPEND_WEIGHTS.length]);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

  let restCents = totalCents;
  return items.map((item, index) => {
    // Oxirgi videoga qoldiq — yig'indi jami sarfga aniq teng bo'lsin
    const cents =
      index === items.length - 1 ? restCents : Math.round((totalCents * weights[index]) / weightSum);
    restCents -= cents;
    const spent = cents / 100;

    return {
      ...item,
      spent,
      stats: estimateDelivery(spent, REEL_BENCHMARKS[index % REEL_BENCHMARKS.length]),
    };
  });
}
