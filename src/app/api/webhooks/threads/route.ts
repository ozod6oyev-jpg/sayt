import { NextResponse } from "next/server";
import { getMetaSettings, metaVerifyToken, verifyMetaSignature } from "@/lib/meta";
import { notifyAdmins } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ThreadsValue = {
  id?: string;
  text?: string;
  username?: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
  is_reply_owned_by_me?: boolean;
  root_post?: { id?: string };
  replied_to?: { id?: string };
};

type ThreadsBody = {
  topic?: string;
  values?: { value?: ThreadsValue; field?: string };
  /** Ba'zi yuborishlarda massiv ko'rinishida keladi */
  entry?: ThreadsBody[];
};

/** Threads webhook tekshiruvi (hub.challenge) */
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

function createdAt(value: string | undefined): Date {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/** Threads izohi yoki mentionini suhbatga yozish */
async function storeEvent(value: ThreadsValue): Promise<void> {
  const username = value.username?.trim().replace(/^@/, "");
  const externalId = value.id;

  if (!externalId) return;

  const settings = await getMetaSettings();
  const ownUsername = settings.threadsUsername?.replace(/^@/, "") ?? "";
  const isOwner =
    value.is_reply_owned_by_me === true || (Boolean(ownUsername) && username === ownUsername);

  const chatKey = username ? username.toLowerCase() : `post-${value.root_post?.id ?? externalId}`;
  const name = username ? `@${username}` : `Threads · ${value.root_post?.id ?? externalId}`;
  const when = createdAt(value.timestamp);

  const chat = await prisma.metaChat.upsert({
    where: { platform_externalId: { platform: "threads", externalId: chatKey } },
    create: {
      platform: "threads",
      externalId: chatKey,
      name,
      username: username ? `@${username}` : null,
      lastMessageAt: when,
    },
    update: { lastMessageAt: when },
  });

  await prisma.metaMessage.create({
    data: {
      chatRefId: chat.id,
      externalId,
      direction: isOwner ? "out" : "in",
      text: value.text?.trim() || "[media]",
      createdAt: when,
      readAt: isOwner ? when : null,
    },
  });

  if (isOwner) return;

  await notifyAdmins({
    kind: "meta",
    title: `Threads · ${name}`,
    body: value.text?.trim() || "[media]",
    href: `/admin/meta/xabarlar?chat=${chat.id}&tur=threads`,
  });
}

/** Threads voqealari: izohlar (replies) va mentionlar */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  // Meta imzo yuborsa tekshiramiz; Threads ba'zi holatlarda imzosiz yuboradi
  if (signature && !(await verifyMetaSignature(raw, signature))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: ThreadsBody;
  try {
    body = JSON.parse(raw) as ThreadsBody;
  } catch {
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  }

  const events = body.entry ?? [body];

  for (const event of events) {
    const value = event.values?.value;
    if (!value) continue;

    try {
      await storeEvent(value);
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") {
        console.error("Threads webhook xatosi:", (error as Error).message);
      }
    }
  }

  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
