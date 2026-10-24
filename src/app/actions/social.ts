"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishToTarget, type SocialKind } from "@/lib/social-publish";
import { saveSocialMedia, type SavedMedia } from "@/lib/uploads";

const KINDS: SocialKind[] = [
  "ig_reel",
  "ig_post",
  "ig_story",
  "fb_reel",
  "fb_post",
  "fb_story",
  "threads_post",
];

const MAX_CAPTION = 2200; // Instagram chegarasi
const MAX_HASHTAGS = 30;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** "#uy #sotiladi, uy-joy" → "#uy #sotiladi #uy-joy" */
function normalizeHashtags(raw: string): string[] {
  const tags = raw
    .split(/[\s,;]+/)
    .map((tag) => tag.replace(/^#+/, "").trim())
    .filter(Boolean)
    .map((tag) => `#${tag}`);

  return [...new Set(tags)].slice(0, MAX_HASHTAGS);
}

/** Bitta media'ni tanlangan platformalarga joylash */
export async function publishSocialAction(formData: FormData): Promise<void> {
  await requireOwner();

  const caption = text(formData, "caption");
  const captionFb = text(formData, "captionFb");
  const hashtags = normalizeHashtags(text(formData, "hashtags"));
  const file = formData.get("media");
  const targets = formData
    .getAll("targets")
    .filter((value): value is string => typeof value === "string")
    .filter((value): value is SocialKind => (KINDS as string[]).includes(value));

  if (caption.length > MAX_CAPTION) {
    redirect("/admin/meta/studio?post=long");
  }
  if (!(file instanceof File) || file.size === 0 || targets.length === 0) {
    redirect("/admin/meta/studio?post=invalid");
  }

  let media: SavedMedia;
  try {
    media = await saveSocialMedia(file);
  } catch {
    redirect("/admin/meta/studio?post=media");
  }

  const fullCaption = [caption, hashtags.join(" ")].filter(Boolean).join("\n\n");
  const fullCaptionFb = captionFb
    ? [captionFb, hashtags.join(" ")].filter(Boolean).join("\n\n")
    : undefined;

  const rawCover = Number.parseInt(text(formData, "coverOffset"), 10);
  const coverOffset = Number.isFinite(rawCover) && rawCover >= 0 && rawCover <= 3600 ? rawCover : null;

  const collaborators = text(formData, "collaborators")
    .split(/[\s,]+/)
    .map((name) => name.replace(/^@+/, "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(",");

  const threadsTopic = text(formData, "threadsTopic")
    .replace(/^#+/, "")
    .replace(/[^\p{L}\p{N}_ ]/gu, "")
    .trim()
    .slice(0, 50);

  const options = {
    captionFb: fullCaptionFb,
    locationId: text(formData, "locationId") || undefined,
    altText: text(formData, "altText") || undefined,
    coverOffset,
    shareToFeed: formData.get("shareToFeed") === "on",
    collaborators: collaborators || undefined,
    fbTitle: text(formData, "fbTitle") || undefined,
    threadsReply: text(formData, "threadsReply") || undefined,
    threadsTopic: threadsTopic || undefined,
  };

  const post = await prisma.socialPost.create({
    data: {
      caption,
      captionFb: captionFb || null,
      hashtags: hashtags.join(" "),
      mediaType: media.type,
      mediaUrl: media.url,
      locationId: options.locationId ?? null,
      altText: options.altText ?? null,
      coverOffset,
      shareToFeed: options.shareToFeed,
      collaborators: collaborators || null,
      fbTitle: options.fbTitle ?? null,
      threadsReply: options.threadsReply ?? null,
      threadsTopic: threadsTopic || null,
    },
  });

  for (const kind of targets) {
    const result = await publishToTarget(kind, media, fullCaption, options);

    await prisma.socialTarget.create({
      data: {
        postRefId: post.id,
        kind,
        status: result.ok ? "sent" : "failed",
        externalId: result.ok ? result.id : null,
        error: result.ok ? null : result.error.slice(0, 300),
      },
    });
  }

  const failed = await prisma.socialTarget.count({
    where: { postRefId: post.id, status: "failed" },
  });

  revalidatePath("/admin/meta/studio");
  redirect(`/admin/meta/studio?post=${failed > 0 ? "partial" : "ok"}`);
}
