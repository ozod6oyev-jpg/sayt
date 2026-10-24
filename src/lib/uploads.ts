import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_WIDTH = 1920;
const QUALITY = 82;

/** Barcha yuklangan rasmlar shu papkada saqlanadi */
export function uploadsRoot(): string {
  return path.join(process.cwd(), "uploads");
}

export type SavedImage = {
  url: string;
  width: number;
  height: number;
};

/**
 * Yuklangan rasmni WebP ga aylantiradi, 1920px dan katta bo'lsa kichraytiradi.
 * Discover va Search uchun 1200px+ kenglik saqlanadi.
 */
export async function saveImage(file: File): Promise<SavedImage> {
  if (!file || typeof file === "string" || file.size === 0) {
    throw new Error("Rasm tanlanmagan");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Faqat rasm fayllarini yuklash mumkin");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Rasm hajmi 15 MB dan katta bo'lmasligi kerak");
  }

  const input = Buffer.from(await file.arrayBuffer());

  let pipeline = sharp(input).rotate();
  const metadata = await pipeline.metadata();

  if (!metadata.width) {
    throw new Error("Rasm faylini o'qib bo'lmadi");
  }

  if (metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH });
  }

  const output = await pipeline.webp({ quality: QUALITY }).toBuffer({ resolveWithObject: true });

  const id = crypto.randomUUID();
  const fileName = `${id}.webp`;
  // public/ ichida emas: production server fayllar ro'yxatini build paytida
  // eslab qoladi, shuning uchun yangi yuklangan rasmlar 404 bo'ladi.
  const uploadsDir = uploadsRoot();

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, fileName), output.data);

  return {
    url: `/uploads/${fileName}`,
    width: output.info.width,
    height: output.info.height,
  };
}
