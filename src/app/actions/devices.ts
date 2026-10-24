"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/totp";

export async function toggleDeviceTrust(id: string, formData: FormData): Promise<void> {
  const user = await requireOwner();

  const device = await prisma.verifiedDevice.findUnique({ where: { id } });
  if (!device) redirect("/admin/kirish-huquqi");

  // Ishonchli deb belgilash uchun authenticator kodi shart
  if (!device.isTrusted) {
    const token = String(formData.get("otp") ?? "").trim();
    if (!verifyTotp(user.totpSecret, token)) {
      redirect("/admin/kirish-huquqi?error=otp");
    }
  }

  await prisma.verifiedDevice.update({
    where: { id },
    data: { isTrusted: !device.isTrusted },
  });

  revalidatePath("/admin/kirish-huquqi");
}

export async function deleteDevice(id: string): Promise<void> {
  await requireOwner();

  await prisma.verifiedDevice.delete({ where: { id } }).catch(() => undefined);

  revalidatePath("/admin/kirish-huquqi");
}
