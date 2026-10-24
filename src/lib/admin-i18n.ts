import { cookies } from "next/headers";
import type { AdminScript, CopyPair } from "./admin-script";

/** Admin panel tili: lotin yoki kirill o'zbekchasi (cookie orqali) */
export async function getAdminScript(): Promise<AdminScript> {
  const store = await cookies();
  return store.get("admin_script")?.value === "cyrl" ? "cyrl" : "lat";
}

/** Sahifaga tegishli matnlardan joriy skriptdagisini qaytaradi */
export async function getAdminCopy<T extends Record<string, string>>(
  pair: CopyPair<T>,
): Promise<T> {
  const script = await getAdminScript();
  return script === "cyrl" ? pair.cyrl : pair.lat;
}
