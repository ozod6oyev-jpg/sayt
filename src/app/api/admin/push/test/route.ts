import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";
import { notificationIcon } from "@/lib/push-image";

export const dynamic = "force-dynamic";

/** Sinov bildirishnomasi — telefonda push ishlayotganini tekshirish */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Sinov faqat shu adminning qurilmalariga yuboriladi
  const devices = await prisma.pushSubscription.count({
    where: { scope: "admin", adminId: user.id },
  });

  if (devices === 0) {
    return NextResponse.json({ ok: false, error: "no_devices", devices });
  }

  const result = await sendPush(
    {
      title: "Sinov bildirishnomasi",
      body: "Push ishlayapti ✅",
      href: "/admin/meta/xabarlar",
      tag: "push-test",
      icon: await notificationIcon({ avatarPath: null, platform: "telegram" }),
    },
    "admin",
    user.id,
  );

  // Hech bir qurilma qabul qilmadi (obuna eskirgan) — UI'ga ayon bo'lsin
  return NextResponse.json({
    ok: result.delivered > 0,
    devices,
    delivered: result.delivered,
  });
}
