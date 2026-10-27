export const ADMIN_COUNTS_EVENT = "admin:counts";

export type AdminCounts = { total: number; lead: number; meta: number; telegram: number };

/** Menyudagi va qo'ng'iroqdagi sanoqlarni sahifani qayta yuklamasdan yangilash */
export function emitAdminCounts(counts: AdminCounts): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AdminCounts>(ADMIN_COUNTS_EVENT, { detail: counts }));
}
