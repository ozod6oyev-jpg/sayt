import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminUser } from "@prisma/client";
import { prisma } from "./prisma";

const SESSION_COOKIE = "admin_session";
const PENDING_COOKIE = "admin_pending";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 kun
const PENDING_TTL_SECONDS = 60 * 10; // 2FA kiritish uchun 10 daqiqa

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET .env faylda o'rnatilmagan (kamida 16 belgi)");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function createToken(userId: string, ttlSeconds: number): string {
  const expires = Date.now() + ttlSeconds * 1000;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): string | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expires, signature] = parts;
  if (!userId || !expires || !signature) return null;

  const payload = `${userId}.${expires}`;
  if (!safeEqual(signature, sign(payload))) return null;
  if (!Number.isFinite(Number(expires)) || Number(expires) < Date.now()) return null;

  return userId;
}

async function cookieOptions(maxAge: number) {
  // https orqali kelganda secure, http (masalan IP:port) orqali kelganda oddiy cookie
  const requestHeaders = await headers();
  const proto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = requestHeaders.get("host") ?? "";
  const secure = proto ? proto === "https" : !host.startsWith("localhost") && !/^\d+(\.\d+){3}/.test(host);

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge,
  };
}

/** To'liq kirgandan keyin (parol + 2FA) sessiya yaratadi */
export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    createToken(userId, SESSION_TTL_SECONDS),
    await cookieOptions(SESSION_TTL_SECONDS),
  );
}

/** Parol to'g'ri, lekin 2FA kodi hali kiritilmagan holat */
export async function createPendingSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    PENDING_COOKIE,
    createToken(userId, PENDING_TTL_SECONDS),
    await cookieOptions(PENDING_TTL_SECONDS),
  );
}

export async function readPendingUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return readToken(cookieStore.get(PENDING_COOKIE)?.value);
}

export async function destroyPendingSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_COOKIE);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(PENDING_COOKIE);
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const userId = readToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return null;

  return user;
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/kirish");
  }
  return user;
}

export async function requireOwner(): Promise<AdminUser> {
  const user = await requireAdmin();
  if (user.role !== "owner") {
    redirect("/admin");
  }
  return user;
}
