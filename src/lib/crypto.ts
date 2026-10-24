import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Tokenlarni bazada shifrlab saqlash uchun kalit.
 * META_ENCRYPTION_KEY bo'lmasa SESSION_SECRET dan hosil qilinadi.
 */
function key(): Buffer {
  const explicit = process.env.META_ENCRYPTION_KEY?.trim();
  if (explicit && /^[0-9a-f]{64}$/i.test(explicit)) {
    return Buffer.from(explicit, "hex");
  }

  const fallback = process.env.SESSION_SECRET?.trim() ?? "uyjoy-meta-fallback";
  return scryptSync(fallback, "uyjoy-meta-token", 32);
}

/** Matnni shifrlaydi: v1:<iv>:<tag>:<cipher> */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/** Shifrlangan matnni qaytaradi, xato bo'lsa null */
export function decryptSecret(value: string | null | undefined): string | null {
  if (!value) return null;

  const parts = value.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") return null;

  try {
    const iv = Buffer.from(parts[1], "hex");
    const tag = Buffer.from(parts[2], "hex");
    const data = Buffer.from(parts[3], "hex");
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Log va UI uchun niqoblangan ko'rinish */
export function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
