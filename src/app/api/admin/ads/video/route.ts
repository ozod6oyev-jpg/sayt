import { execFile } from "child_process";
import { randomUUID } from "crypto";
import { access } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveSocialMedia, uploadsRoot } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const run = promisify(execFile);

/** Videoning 9:16 muqovasi — Meta kreativ uchun `image_url` talab qiladi */
async function makeThumbnail(videoPath: string): Promise<string | null> {
  const fileName = `reels-${randomUUID()}.jpg`;
  const output = path.join(uploadsRoot(), fileName);

  try {
    await run(
      "ffmpeg",
      [
        "-y",
        "-ss",
        "0.5",
        "-i",
        videoPath,
        "-frames:v",
        "1",
        "-vf",
        "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
        output,
      ],
      { timeout: 60_000 },
    );

    await access(output);
    return `/uploads/${fileName}`;
  } catch {
    return null;
  }
}

/** Reklama uchun video yuklash (Reels) — fayl `uploads/` ga saqlanadi */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    return NextResponse.json({ ok: false, error: "Ruxsat yo'q" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Fayl tanlanmagan" }, { status: 400 });
  }

  try {
    const saved = await saveSocialMedia(file);

    if (saved.type !== "video") {
      return NextResponse.json({ ok: false, error: "Faqat video yuklash mumkin" }, { status: 400 });
    }

    const thumbnail = await makeThumbnail(saved.localPath);

    if (!thumbnail) {
      return NextResponse.json(
        { ok: false, error: "Videodan muqova tayyorlab bo'lmadi — boshqa fayl sinab ko'ring" },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, url: saved.url, thumbnail });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message || "Yuklab bo'lmadi" },
      { status: 400 },
    );
  }
}
