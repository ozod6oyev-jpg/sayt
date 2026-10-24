"use server";

import { timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import {
  createPendingSession,
  createSession,
  destroyPendingSession,
  destroySession,
  readPendingUserId,
  requireAdmin,
} from "@/lib/auth";
import { hashPassword, isValidEmail, isValidPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, verifyTotp } from "@/lib/totp";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bootstrapKeyMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;

  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Birinchi ishga tushirish: owner hisobini yaratadi */
export async function setupOwner(formData: FormData): Promise<void> {
  const existing = await prisma.adminUser.count();
  if (existing > 0) {
    redirect("/kirish");
  }

  const setupKey = text(formData, "setupKey");
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!bootstrapKeyMatches(setupKey)) {
    redirect("/kirish/sozlash?error=key");
  }
  if (name.length < 2 || !isValidEmail(email) || !isValidPassword(password)) {
    redirect("/kirish/sozlash?error=fields");
  }
  if (password !== confirm) {
    redirect("/kirish/sozlash?error=match");
  }

  const user = await prisma.adminUser
    .create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: "owner",
        totpSecret: generateTotpSecret(),
        totpEnabled: true,
      },
    })
    .catch(() => null);

  if (!user) {
    redirect("/kirish/sozlash?error=email");
  }

  await createSession(user.id);
  redirect("/admin/profil?setup=1");
}

export async function login(formData: FormData): Promise<void> {
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/kirish?error=1");
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });

  // Foydalanuvchi bor-yo'qligini oshkor qilmaymiz
  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !user.isActive || !passwordOk) {
    redirect("/kirish?error=1");
  }

  if (user.totpEnabled) {
    await createPendingSession(user.id);
    redirect("/kirish/2fa");
  }

  await createSession(user.id);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  redirect("/admin");
}

export async function verifyTwoFactor(formData: FormData): Promise<void> {
  const userId = await readPendingUserId();
  if (!userId) {
    redirect("/kirish");
  }

  const token = text(formData, "token");
  const user = await prisma.adminUser.findUnique({ where: { id: userId } });

  if (!user || !user.isActive) {
    await destroyPendingSession();
    redirect("/kirish?error=1");
  }

  if (!verifyTotp(user.totpSecret, token)) {
    redirect("/kirish/2fa?error=1");
  }

  await destroyPendingSession();
  await createSession(user.id);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/kirish");
}

/** O'z parolini almashtirish (joriy parolni tasdiqlash bilan) */
export async function changeOwnPassword(formData: FormData): Promise<void> {
  const user = await requireAdmin();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const currentOk = await verifyPassword(current, user.passwordHash);
  if (!currentOk) {
    redirect("/admin/profil?error=current");
  }
  if (!isValidPassword(next)) {
    redirect("/admin/profil?error=weak");
  }
  if (next !== confirm) {
    redirect("/admin/profil?error=match");
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  redirect("/admin/profil?saved=password");
}

/** Authenticator sirini qayta yaratish (eski kalit ishlamay qoladi) */
export async function regenerateOwnTotp(): Promise<void> {
  const user = await requireAdmin();

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { totpSecret: generateTotpSecret(), totpEnabled: true },
  });

  redirect("/admin/profil?saved=totp");
}
