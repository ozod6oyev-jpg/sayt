import { readFile, stat } from "fs/promises";
import path from "path";
import { uploadsRoot } from "@/lib/uploads";

const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  if (!SAFE_NAME.test(file) || file.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(uploadsRoot(), file);

  try {
    const info = await stat(filePath);
    const extension = path.extname(file).toLowerCase();
    const contentType = CONTENT_TYPES[extension] ?? "application/octet-stream";
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
    };

    // Video/audio uchun Range so'rovlar (seek ishlashi uchun)
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;

        if (start <= end && start < info.size) {
          const buffer = await readFile(filePath);
          const chunk = buffer.subarray(start, end + 1);

          return new Response(new Uint8Array(chunk), {
            status: 206,
            headers: {
              ...headers,
              "Content-Range": `bytes ${start}-${end}/${info.size}`,
              "Content-Length": String(chunk.length),
            },
          });
        }
      }

      return new Response("Range not satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${info.size}` },
      });
    }

    const buffer = await readFile(filePath);
    return new Response(new Uint8Array(buffer), { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
