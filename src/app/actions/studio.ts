"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishPostTargets } from "@/lib/publish-post";
import type { SocialKind } from "@/lib/social-publish";
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

/** Bitta media'ni tanlangan platformalarga joylash yoki navbatga qo'yish */
export async function publishSocialAction(formData: FormData): Promise<void> {
  await requireOwner();

  const captions = {
    ig: text(formData, "ig_caption"),
    fb: text(formData, "fb_caption"),
    threads: text(formData, "threads_caption"),
  };

  const hashtags = normalizeHashtags(text(formData, "hashtags"));
  const hashtagsFb = normalizeHashtags(text(formData, "hashtags_fb"));
  const hashtagsThreads = normalizeHashtags(text(formData, "hashtags_threads"));

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

  let coverUrl: string | null = null;
  const coverFile = formData.get("cover");
  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      coverUrl = (await saveCoverImage(coverFile)).url;
    } catch {
      coverUrl = null;
    }
  }

  const rawSchedule = text(formData, "scheduledAt");
  const scheduleDate = rawSchedule ? new Date(rawSchedule) : null;
  const scheduledAt =
    scheduleDate && !Number.isNaN(scheduleDate.getTime()) && scheduleDate.getTime() > Date.now() + 20_000
      ? scheduleDate
      : null;

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

  const threadsTopic = text(formData, "threadsTopic")
    .replace(/^#+/, "")
    .replace(/[^\p{L}\p{N}_ ]/gu, "")
    .trim()
    .slice(0, 50);

  const post = await prisma.socialPost.create({
    data: {
      caption: captions.ig,
      captionFb: captions.fb || null,
      captionThreads: captions.threads || null,
      hashtags: hashtags.join(" "),
      hashtagsFb: hashtagsFb.join(" ") || null,
      hashtagsThreads: hashtagsThreads.join(" ") || null,
      mediaType: media.type,
      mediaUrl: media.url,
      igLocationId: text(formData, "igLocation") || null,
      igLocationName: text(formData, "igLocationName") || null,
      fbLocationId: text(formData, "fbLocation") || null,
      fbLocationName: text(formData, "fbLocationName") || null,
      altText: text(formData, "altText") || null,
      coverUrl,
      shareToFeed: formData.get("shareToFeed") === "on",
      collaborators: collaborators || null,
      fbTitle: text(formData, "fbTitle") || null,
      threadsReply: text(formData, "threadsReply") || null,
      threadsTopic: threadsTopic || null,
      hideLikeCounts: formData.get("hideLikeCounts") === "on",
      audioName: text(formData, "audioName") || null,
      userTags: userTags.join(",") || null,
      paidPartner: text(formData, "paidPartner") || null,
      scheduledAt,
      status: scheduledAt ? "scheduled" : "publishing",
      targets: {
        create: targets.map((kind) => ({ kind, status: "pending" })),
      },
    },
  });

  if (scheduledAt) {
    revalidatePath("/admin/meta/studio");
    redirect("/admin/meta/studio?post=scheduled");
  }

  const result = await publishPostTargets(post.id);

  revalidatePath("/admin/meta/studio");
  redirect(`/admin/meta/studio?post=${result.failed > 0 ? "partial" : "ok"}`);
}
