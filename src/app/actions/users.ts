"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { hashPassword, isValidEmail, isValidPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret } from "@/lib/totp";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Owner yangi admin yaratadi va authenticator kalitini oladi */
export async function createAdmin(formData: FormData): Promise<void> {
  const owner = await requireOwner();

  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const role = text(formData, "role") === "owner" ? "owner" : "admin";

  if (name.length < 2) {
    redirect("/admin/users?error=name");
  }
  if (!isValidEmail(email)) {
    redirect("/admin/users?error=emailformat");
  }
  if (!isValidPassword(password)) {
    redirect("/admin/users?error=weak");
  }
  if (password !== confirm) {
    redirect("/admin/users?error=match");
  }

  try {
    const user = await prisma.adminUser.create({
      data: {
        name,
        email,
        role,
        passwordHash: await hashPassword(password),
        totpSecret: generateTotpSecret(),
        totpEnabled: true,
        createdById: owner.id,
      },
    });

    redirect(`/admin/users/${user.id}?created=1`);
  } catch (error) {
    // redirect() o'zi xato tashlaydi — uni DB xatosi bilan aralashtirmaymiz
    if (typeof (error as { digest?: unknown }).digest === "string") {
      throw error;
    }
    if ((error as { code?: string }).code === "P2002") {
      redirect("/admin/users?error=email");
    }

    console.error("Admin yaratishda kutilmagan xato:", error);
    redirect("/admin/users?error=db");
  }
}

/** Owner admin parolini yangilaydi (2FA kodi o'zgarmaydi) */
export async function resetAdminPassword(id: string, formData: FormData): Promise<void> {
  await requireOwner();

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!isValidPassword(password)) {
    redirect(`/admin/users/${id}?error=weak`);
  }
  if (password !== confirm) {
    redirect(`/admin/users/${id}?error=match`);
  }

  const updated = await prisma.adminUser
    .update({
      where: { id },
      data: { passwordHash: await hashPassword(password) },
    })
    .catch(() => null);

  if (!updated) {
    redirect("/admin/users?error=notfound");
  }

  redirect(`/admin/users/${id}?saved=password`);
}

/** Yangi authenticator siri (eski kalit ishlamay qoladi) */
export async function regenerateAdminTotp(id: string): Promise<void> {
  await requireOwner();

  const updated = await prisma.adminUser
    .update({
      where: { id },
      data: { totpSecret: generateTotpSecret(), totpEnabled: true },
    })
    .catch(() => null);

  if (!updated) {
    redirect("/admin/users?error=notfound");
  }

  redirect(`/admin/users/${id}?saved=totp`);
}

/** Adminni vaqtincha bloklash yoki faollashtirish */
export async function toggleAdminActive(id: string): Promise<void> {
  const owner = await requireOwner();

  if (id === owner.id) {
    redirect(`/admin/users/${id}?error=self`);
  }

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) {
    redirect("/admin/users?error=notfound");
  }

  if (target.role === "owner" && target.isActive) {
    const activeOwners = await prisma.adminUser.count({
      where: { role: "owner", isActive: true },
    });
    if (activeOwners <= 1) {
      redirect(`/admin/users/${id}?error=lastowner`);
    }
  }

  await prisma.adminUser.update({
    where: { id },
    data: { isActive: !target.isActive },
  });

  redirect(`/admin/users/${id}?saved=status`);
}
