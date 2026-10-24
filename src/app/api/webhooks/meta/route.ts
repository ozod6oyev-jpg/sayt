import { NextResponse } from "next/server";
import { metaVerifyToken, verifyMetaSignature } from "@/lib/meta";
import { notifyAdmins } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MetaMessaging = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    attachments?: { type?: string }[];
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

        const stored = await prisma.metaMessage.create({
          data: {
            chatRefId: chat.id,
            externalId: message.mid ?? null,
            direction: "in",
            text: textOf(message),
            createdAt,
          },
        });

        await notifyAdmins({
          kind: "meta",
          title: `${platform === "instagram" ? "Instagram" : "Facebook"} · ${chat.name}`,
          body: stored.text,
          href: "/admin/meta/xabarlar",
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
