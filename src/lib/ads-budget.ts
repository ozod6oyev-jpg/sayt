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
