"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishToTarget, type SocialKind } from "@/lib/social-publish";
import { saveCoverImage, saveSocialMedia, type SavedMedia } from "@/lib/uploads";

const KINDS: SocialKind[] = [
  "ig_reel",
  "ig_post",
  "ig_story",
  "fb_reel",
  "fb_post",
  "fb_story",
  "threads_post",
];

const MAX_CAPTION = { ig: 2200, fb: 5000, threads: 500 };

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

  return [...new Set(tags)].slice(0, 30);
}

/** Bitta media'ni tanlangan platformalarga joylash */
export async function publishSocialAction(formData: FormData): Promise<void> {
  await requireOwner();

  const captions = {
    ig: text(formData, "ig_caption"),
    fb: text(formData, "fb_caption"),
    threads: text(formData, "threads_caption"),
  };

  const hashtags = normalizeHashtags(text(formData, "hashtags"));
  const file = formData.get("media");
  const targets = formData
    .getAll("targets")
    .filter((value): value is string => typeof value === "string")
    .filter((value): value is SocialKind => (KINDS as string[]).includes(value));

  if (captions.ig.length > MAX_CAPTION.ig || captions.fb.length > MAX_CAPTION.fb) {
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

  const tags = hashtags.join(" ");
  const withTags = (value: string) => [value, tags].filter(Boolean).join("\n\n");
  const fullIg = withTags(captions.ig);
  const fullFb = withTags(captions.fb);
  const fullThreads = withTags(captions.threads.slice(0, MAX_CAPTION.threads));

  let coverUrl: string | null = null;
  const coverFile = formData.get("cover");
  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      coverUrl = (await saveCoverImage(coverFile)).url;
    } catch {
      coverUrl = null;
    }
  }

  const collaborators = text(formData, "collaborators")
    .split(/[\s,]+/)
    .map((name) => name.replace(/^@+/, "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(",");

  const userTags = text(formData, "userTags")
    .split(/[\s,]+/)
    .map((name) => name.replace(/^@+/, "").trim())
    .filter(Boolean)
    .slice(0, 10);

  const rawSchedule = text(formData, "fbScheduleAt");
  const scheduleDate = rawSchedule ? new Date(rawSchedule) : null;
  const fbScheduledAt =
    scheduleDate && !Number.isNaN(scheduleDate.getTime()) && scheduleDate.getTime() > Date.now() + 60_000
      ? scheduleDate
      : null;

  const threadsTopic = text(formData, "threadsTopic")
    .replace(/^#+/, "")
    .replace(/[^\p{L}\p{N}_ ]/gu, "")
    .trim()
    .slice(0, 50);

  const igLocationId = text(formData, "igLocation");
  const fbLocationId = text(formData, "fbLocation");

  const options = {
    igLocationId: igLocationId || undefined,
    fbPlaceId: fbLocationId || undefined,
    altText: text(formData, "altText") || undefined,
    coverUrl: coverUrl ?? undefined,
    shareToFeed: formData.get("shareToFeed") === "on",
    collaborators: collaborators || undefined,
    fbTitle: text(formData, "fbTitle") || undefined,
    threadsReply: text(formData, "threadsReply") || undefined,
    threadsTopic: threadsTopic || undefined,
    hideLikeCounts: formData.get("hideLikeCounts") === "on",
    audioName: text(formData, "audioName") || undefined,
    userTags,
    paidPartner: text(formData, "paidPartner") || undefined,
    fbScheduledAt: fbScheduledAt ? Math.floor(fbScheduledAt.getTime() / 1000) : undefined,
  };

  const post = await prisma.socialPost.create({
    data: {
      caption: captions.ig,
      captionFb: captions.fb || null,
      captionThreads: captions.threads || null,
      hashtags: tags,
      mediaType: media.type,
      mediaUrl: media.url,
      igLocationId: igLocationId || null,
      igLocationName: text(formData, "igLocationName") || null,
      fbLocationId: fbLocationId || null,
      fbLocationName: text(formData, "fbLocationName") || null,
      altText: options.altText ?? null,
      coverUrl: coverUrl ?? undefined,
      shareToFeed: options.shareToFeed,
      collaborators: collaborators || null,
      fbTitle: options.fbTitle ?? null,
      threadsReply: options.threadsReply ?? null,
      threadsTopic: threadsTopic || null,
      hideLikeCounts: options.hideLikeCounts,
      audioName: options.audioName ?? null,
      userTags: userTags.join(",") || null,
      paidPartner: options.paidPartner ?? null,
      fbScheduledAt,
    },
  });

  for (const kind of targets) {
    const caption = kind.startsWith("ig_")
      ? fullIg
      : kind.startsWith("fb_")
        ? fullFb || fullIg
        : fullThreads || fullIg;

    const result = await publishToTarget(kind, media, caption, options);

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
