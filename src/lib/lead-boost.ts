/**
 * E'lonlar bo'yicha so'rovlar soniga qo'shiladigan ko'rsatkich.
 * Faqat panelda ko'rsatish uchun — bazadagi Lead yozuvlariga tegmaydi.
 */
export const LEAD_BOOST_MIN = 20;
export const LEAD_BOOST_MAX = 60;

/** E'lon ID'sidan barqaror son — sahifa har yangilanganda bir xil chiqadi */
function hashId(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Shu e'lon uchun qo'shimcha so'rovlar soni (20–60) */
export function leadBoostFor(listingId: string): number {
  const span = LEAD_BOOST_MAX - LEAD_BOOST_MIN + 1;
  return LEAD_BOOST_MIN + (hashId(listingId) % span);
}

/** Haqiqiy so'rovlar + qo'shilgan ko'rsatkich */
export function leadsWithBoost(realLeads: number, listingId: string): number {
  return realLeads + leadBoostFor(listingId);
}

/** Barcha e'lonlar bo'yicha qo'shilgan ko'rsatkichlar yig'indisi */
export function boostTotal(listingIds: string[]): number {
  return listingIds.reduce((sum, id) => sum + leadBoostFor(id), 0);
}
