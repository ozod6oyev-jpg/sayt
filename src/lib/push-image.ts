import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { uploadsRoot } from "./uploads";

export type PushPlatform = "telegram" | "instagram" | "facebook" | "threads";

const SIZE = 256;
const BADGE = 84;
const BRAND = "#0d3b66";

/** Tarmoq belgilari — dumaloq fon + oq glif */
const BADGES: Record<PushPlatform, string> = {
  telegram: `
    <svg xmlns="http://www.w3.org/2000/svg" width="${BADGE}" height="${BADGE}" viewBox="0 0 104 104">
      <circle cx="52" cy="52" r="52" fill="#229ED9"/>
      <path d="M78 30 24 51c-3 1-3 3 0 4l14 4 5 16c1 3 3 3 4 1l7-7 13 10c2 2 4 1 5-2l8-40c1-4-1-6-2-7z" fill="#fff"/>
      <path d="M45 62l24-18c1-1 2 0 1 1L50 64l-1 8c-1 2-2 1-3-1z" fill="#cfeaf7"/>
    </svg>`,
  instagram: `
    <svg xmlns="http://www.w3.org/2000/svg" width="${BADGE}" height="${BADGE}" viewBox="0 0 104 104">
      <defs>
        <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#feda75"/>
          <stop offset="0.5" stop-color="#d62976"/>
          <stop offset="1" stop-color="#4f5bd5"/>
        </linearGradient>
      </defs>
      <circle cx="52" cy="52" r="52" fill="url(#ig)"/>
      <rect x="28" y="28" width="48" height="48" rx="14" fill="none" stroke="#fff" stroke-width="6"/>
      <circle cx="52" cy="52" r="12" fill="none" stroke="#fff" stroke-width="6"/>
      <circle cx="68" cy="36" r="4" fill="#fff"/>
    </svg>`,
  facebook: `
    <svg xmlns="http://www.w3.org/2000/svg" width="${BADGE}" height="${BADGE}" viewBox="0 0 104 104">
      <circle cx="52" cy="52" r="52" fill="#1877F2"/>
      <path d="M58 82V56h9l2-11H58v-7c0-3 1-5 5-5h6V23c-2 0-7-1-12-1-12 0-18 7-18 19v4H30v11h9v26z" fill="#fff"/>
    </svg>`,
  threads: `
    <svg xmlns="http://www.w3.org/2000/svg" width="${BADGE}" height="${BADGE}" viewBox="0 0 104 104">
      <circle cx="52" cy="52" r="52" fill="#000"/>
      <text x="52" y="70" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif"
            font-size="56" font-weight="700" fill="#fff">@</text>
    </svg>`,
};

function badgeFor(platform: PushPlatform): Buffer {
  return Buffer.from(BADGES[platform]);
}

/**
 * Telefonda bildirishnoma chap tomonida ko'rinadigan ikonka:
 * sayt logotipi (shaffofsiz, brend rangli fon) + burchagida kichik tarmoq belgisi.
 * Shaffoflik bo'lmasligi Android'da oq doira chiqishini oldini oladi.
 */
export async function notificationIcon(options: {
  avatarPath?: string | null;
  platform: PushPlatform;
}): Promise<string | null> {
  const hash = createHash("sha1").update(`v3:${options.platform}`).digest("hex").slice(0, 16);
  const fileName = `push-${hash}.png`;
  const dir = uploadsRoot();
  const target = path.join(dir, fileName);
  const url = `/uploads/${fileName}`;

  try {
    const existing = await readFile(target).catch(() => null);
    if (existing) return url;

    const logoBuffer = await readFile(path.join(process.cwd(), "public", "logo-mark.png")).catch(
      () => null,
    );

    const badge = await sharp(badgeFor(options.platform)).resize(BADGE, BADGE).png().toBuffer();

    const base = logoBuffer
      ? sharp(logoBuffer).resize(SIZE, SIZE, { fit: "cover", position: "centre" }).removeAlpha()
      : sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: BRAND } });

    const icon = await base
      .composite([{ input: badge, left: SIZE - BADGE - 8, top: SIZE - BADGE - 8 }])
      .png()
      .toBuffer();

    await mkdir(dir, { recursive: true });
    await writeFile(target, icon);

    return url;
  } catch {
    return null;
  }
}
