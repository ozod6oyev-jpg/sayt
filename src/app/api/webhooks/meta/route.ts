import { NextResponse } from "next/server";
import { metaVerifyToken, verifyMetaSignature } from "@/lib/meta";
import { notifyAdmins } from "@/lib/notifications";
import { notificationIcon } from "@/lib/push-image";
import { syncMetaChatProfile } from "@/lib/meta-profile";
import { prisma } from "@/lib/prisma";
import { extensionFromMime, saveMediaBuffer } from "@/lib/uploads";

export const dynamic = "force-dynamic";

type MetaAttachment = {
  type?: string;
  payload?: { url?: string; mime_type?: string };
};

type MetaMessaging = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  read?: { watermark?: number };
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    attachments?: MetaAttachment[];
  };
};

type MetaEntry = {
  id?: string;
  time?: number;
  messaging?: MetaMessaging[];
};

type MetaWebhookBody = {
  object?: string;
  entry?: MetaEntry[];
};

const ATTACHMENT_TYPES: Record<string, string> = {
  image: "photo",
  video: "video",
  audio: "audio",
  file: "file",
  share: "file",
};

/** Meta ilovasidagi biriktirmani (rasm, video, ovoz, fayl) yuklab, lokal saqlash */
async function downloadAttachment(
  message: MetaMessaging["message"],
): Promise<{ path: string; type: string } | null> {
  const attachment = message?.attachments?.find((item) => item.payload?.url);
  const url = attachment?.payload?.url;
  if (!url) return null;

  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > 25 * 1024 * 1024) return null;

    const mime = (
      attachment?.payload?.mime_type ??
      response.headers.get("content-type") ??
      ""
    ).toLowerCase();

    const saved = await saveMediaBuffer(buffer, extensionFromMime(mime));
    return { path: saved.url, type: ATTACHMENT_TYPES[attachment?.type ?? ""] ?? "file" };
  } catch {
    return null;
  }
}

function textOf(message: MetaMessaging["message"]): string {
  if (!message) return "[xabar]";
  if (message.text) return message.text;
  const attachment = message.attachments?.[0]?.type;
  if (attachment === "image") return "[rasm]";
  if (attachment === "video") return "[video]";
  if (attachment === "audio") return "[ovozli xabar]";
  if (attachment === "file") return "[fayl]";
  return "[xabar]";
}

/** Meta webhook tekshiruvi (hub.challenge) */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge") ?? "";

  if (mode !== "subscribe" || !token) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const expected = await metaVerifyToken();
  if (token !== expected) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

/** Meta voqealari: xabarlar va postlar */
export async function POST(request: Request) {
  const raw = await request.text();

  if (!(await verifyMetaSignature(raw, request.headers.get("x-hub-signature-256")))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: MetaWebhookBody;
  try {
    body = JSON.parse(raw) as MetaWebhookBody;
  } catch {
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  }

  const platform = body.object === "instagram" ? "instagram" : "facebook";

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const senderId = event.sender?.id;
      const message = event.message;

      // Mijoz xabarni o'qidi (Meta read eventi) — chiquvchi xabarlar 2 prichka bo'ladi
      if (senderId && event.read?.watermark) {
        try {
          const chat = await prisma.metaChat.findUnique({
            where: { platform_externalId: { platform, externalId: senderId } },
          });

          if (chat) {
            const watermark = new Date(event.read.watermark);
            await prisma.metaMessage.updateMany({
              where: {
                chatRefId: chat.id,
                direction: "out",
                readAt: null,
                createdAt: { lte: watermark },
              },
              data: { readAt: watermark },
            });
          }
        } catch (error) {
          console.error("Meta read event xatosi:", (error as Error).message);
        }
      }

      if (!senderId || !message || message.is_echo) continue;

      const createdAt = event.timestamp ? new Date(event.timestamp) : new Date();

      try {
        const chat = await prisma.metaChat.upsert({
          where: { platform_externalId: { platform, externalId: senderId } },
          create: {
            platform,
            externalId: senderId,
            name: `${platform === "instagram" ? "IG" : "FB"} · ${senderId.slice(-6)}`,
            lastMessageAt: createdAt,
          },
          update: { lastMessageAt: createdAt },
        });

        const media = await downloadAttachment(message);

        const stored = await prisma.metaMessage.create({
          data: {
            chatRefId: chat.id,
            externalId: message.mid ?? null,
            direction: "in",
            text: media && !message.text?.trim() ? "" : textOf(message),
            mediaType: media?.type ?? null,
            mediaPath: media?.path ?? null,
            createdAt,
          },
        });

        // Ism, username va profil rasmi — birinchi xabarda yangilanadi
        await syncMetaChatProfile(chat.id).catch(() => null);
        const profile = await prisma.metaChat.findUnique({
          where: { id: chat.id },
          select: { name: true, avatarPath: true },
        });

        const icon = await notificationIcon({
          avatarPath: profile?.avatarPath ?? null,
          platform: platform === "instagram" ? "instagram" : "facebook",
        });

        await notifyAdmins({
          kind: "meta",
          title: `${platform === "instagram" ? "Instagram" : "Facebook"} · ${profile?.name ?? chat.name}`,
          body: stored.text || (stored.mediaType ? "[media]" : stored.text),
          href: `/admin/meta/xabarlar?chat=${chat.id}`,
          icon,
        });
      } catch (error) {
        if ((error as { code?: string }).code !== "P2002") {
          console.error("Meta webhook xatosi:", (error as Error).message);
        }
      }
    }
  }

  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
