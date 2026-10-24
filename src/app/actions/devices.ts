"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleDeviceTrust(id: string): Promise<void> {
  await requireOwner();

  const device = await prisma.verifiedDevice.findUnique({ where: { id } });
  if (!device) redirect("/admin/kirish-huquqi");

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
