import { readFile } from "fs/promises";
import path from "path";
import { uploadsRoot } from "@/lib/uploads";

const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  if (!SAFE_NAME.test(file) || file.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(uploadsRoot(), file));
    const extension = path.extname(file).toLowerCase();
    const contentType =
      extension === ".webp"
        ? "image/webp"
        : extension === ".png"
          ? "image/png"
          : extension === ".jpg" || extension === ".jpeg"
            ? "image/jpeg"
            : "application/octet-stream";

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
