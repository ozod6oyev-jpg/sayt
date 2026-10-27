import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";

/**
 * Brauzerda yozilgan ovoz (webm/mp4) Telegram'ning voice formati —
 * OGG/OPUS — ga o'giriladi. ffmpeg bo'lmasa yoki o'girish chiqmasa null.
 */
export async function toVoiceOgg(buffer: Buffer, extension: string): Promise<Buffer | null> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "uyjoy-voice-"));

  try {
    const source = path.join(dir, `in.${extension || "bin"}`);
    const target = path.join(dir, "voice.ogg");

    await writeFile(source, buffer);

    await new Promise<void>((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-hide_banner",
          "-loglevel",
          "error",
          "-y",
          "-i",
          source,
          "-vn",
          "-c:a",
          "libopus",
          "-b:a",
          "48k",
          "-ar",
          "48000",
          "-ac",
          "1",
          target,
        ],
        { timeout: 30_000 },
        (error) => (error ? reject(error) : resolve()),
      );
    });

    const output = await readFile(target);
    return output.byteLength > 0 ? output : null;
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => null);
  }
}

/** Brauzerdan kelgan fayl turi — ovozmi? */
export function isAudioMime(mime: string): boolean {
  return mime.startsWith("audio/");
}
