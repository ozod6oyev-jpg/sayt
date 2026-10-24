import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB (Reels)
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

export type SavedMedia = { type: "video" | "image"; url: string; localPath: string };

const VIDEO_TYPES = ["video/mp4", "video/quicktime"];

/**
 * Ijtimoiy tarmoqlarga joylash uchun media: video bo'lsa o'z holida,
 * rasm bo'lsa JPEG'ga aylantirilib saqlanadi (Instagram WebP'ni qabul qilmaydi).
 */
export async function saveSocialMedia(file: File): Promise<SavedMedia> {
  if (!file || typeof file === "string" || file.size === 0) {
    throw new Error("Fayl tanlanmagan");
  }

  const isVideo = file.type.startsWith("video/");

  if (isVideo) {
    if (!VIDEO_TYPES.includes(file.type)) {
      throw new Error("Video MP4 formatida bo'lishi kerak");
    }
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error("Video hajmi 200 MB dan katta bo'lmasligi kerak");
    }
  } else if (file.type.startsWith("image/")) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("Rasm hajmi 15 MB dan katta bo'lmasligi kerak");
    }
  } else {
    throw new Error("Faqat video yoki rasm yuklash mumkin");
  }

  const uploadsDir = uploadsRoot();
  await mkdir(uploadsDir, { recursive: true });

  const id = crypto.randomUUID();

  if (isVideo) {
    const fileName = `${id}.mp4`;
    await writeFile(path.join(uploadsDir, fileName), Buffer.from(await file.arrayBuffer()));
    return {
      type: "video",
      url: `/uploads/${fileName}`,
      localPath: path.join(uploadsDir, fileName),
    };
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

  const output = await pipeline.jpeg({ quality: 88 }).toBuffer();
  const fileName = `${id}.jpg`;
  await writeFile(path.join(uploadsDir, fileName), output);

  return {
    type: "image",
    url: `/uploads/${fileName}`,
    localPath: path.join(uploadsDir, fileName),
  };
}

/** Reels muqovasi — o'z faylidan, 9:16 nisbatda kesiladi */
export async function saveCoverImage(file: File): Promise<{ url: string; localPath: string }> {
  if (!file || typeof file === "string" || file.size === 0) {
    throw new Error("Muqova tanlanmagan");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Muqova rasm bo'lishi kerak");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Muqova hajmi 15 MB dan katta bo'lmasligi kerak");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input)
    .rotate()
    .resize({ width: 1080, height: 1920, fit: "cover", position: "centre" })
    .jpeg({ quality: 90 })
    .toBuffer();

  const uploadsDir = uploadsRoot();
  await mkdir(uploadsDir, { recursive: true });

  const fileName = `cover-${crypto.randomUUID()}.jpg`;
  await writeFile(path.join(uploadsDir, fileName), output);

  return { url: `/uploads/${fileName}`, localPath: path.join(uploadsDir, fileName) };
}
