import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeKey(): string {
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (byte) => KEY_ALPHABET[byte % KEY_ALPHABET.length]);
  const groups = [
    chars.slice(0, 4).join(""),
    chars.slice(4, 8).join(""),
    chars.slice(8, 12).join(""),
  ];
  return `RD-${groups.join("-")}`;
}

function describeDevice(userAgent: string, platform: string): string {
  const ua = userAgent.toLowerCase();
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("opr/") || ua.includes("opera")
      ? "Opera"
      : ua.includes("chrome") && !ua.includes("chromium")
        ? "Chrome"
        : ua.includes("firefox")
          ? "Firefox"
          : ua.includes("safari")
            ? "Safari"
            : "Brauzer";

  const os = ua.includes("iphone") || ua.includes("ipad")
    ? "iOS"
    : ua.includes("android")
      ? "Android"
      : ua.includes("windows")
        ? "Windows"
        : ua.includes("mac os")
          ? "macOS"
          : ua.includes("linux")
            ? "Linux"
            : platform || "Qurilma";

  return `${browser} · ${os}`;
}

function text(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const requestHeaders = await headers();
  const userAgent = text(requestHeaders.get("user-agent"), 400) || "Noma'lum";
  const platform = text(body.platform, 80);
  const language = text(body.language, 40);
  const timezone = text(body.timezone, 60);
  const screen = text(body.screen, 40);
  // Eng oxirgi manzilni olamiz: nginx uni o'zi qo'shadi, shuning uchun soxtalashtirib bo'lmaydi
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",") ?? [];
  const ip = text(
    requestHeaders.get("x-real-ip") ?? forwarded[forwarded.length - 1],
    60,
  );

  const fingerprint = createHash("sha256")
    .update([userAgent, platform, screen, timezone].join("|"))
    .digest("hex");

  const cookieStore = await cookies();
  const existingKey = cookieStore.get("verify_device")?.value;

  const existing =
    (existingKey
      ? await prisma.verifiedDevice.findUnique({ where: { key: existingKey } })
      : null) ??
    (await prisma.verifiedDevice.findFirst({
      where: { fingerprint },
      orderBy: { lastSeenAt: "desc" },
    }));

  const device = existing
    ? await prisma.verifiedDevice.update({
        where: { id: existing.id },
        data: {
          userAgent,
          platform: platform || null,
          language: language || null,
          timezone: timezone || null,
          screen: screen || null,
          ip: ip || null,
          visits: { increment: 1 },
          lastSeenAt: new Date(),
        },
      })
    : await prisma.verifiedDevice.create({
        data: {
          key: makeKey(),
          label: describeDevice(userAgent, platform),
          fingerprint,
          userAgent,
          platform: platform || null,
          language: language || null,
          timezone: timezone || null,
          screen: screen || null,
          ip: ip || null,
        },
      });

  const proto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = requestHeaders.get("host") ?? "";
  const secure = proto ? proto === "https" : !host.startsWith("localhost") && !/^\d+(\.\d+){3}/.test(host);

  const response = NextResponse.json({
    key: device.key,
    label: device.label,
    isTrusted: device.isTrusted,
    visits: device.visits,
    createdAt: device.createdAt.toISOString(),
    lastSeenAt: device.lastSeenAt.toISOString(),
  });

  response.cookies.set("verify_device", device.key, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
