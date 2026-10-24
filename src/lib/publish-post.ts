import { prisma } from "./prisma";
import {
  localMediaPath,
  publishToTarget,
  type PublishOptions,
  type SocialKind,
} from "./social-publish";

function withTags(caption: string, tags: string | null): string {
  return [caption, tags ?? ""].filter(Boolean).join("\n\n");
}

function split(value: string | null): string[] {
  return (value ?? "").split(" ").filter(Boolean);
}

/** Postning navbatdagi (pending) formatlarini joylaydi */
export async function publishPostTargets(postId: string): Promise<{ sent: number; failed: number }> {
  const post = await prisma.socialPost.findUnique({ where: { id: postId }, include: { targets: true } });
  if (!post) return { sent: 0, failed: 0 };

  const media = {
    type: post.mediaType as "video" | "image",
    url: post.mediaUrl,
    localPath: localMediaPath(post.mediaUrl),
  };

  const captions = {
    ig: withTags(post.caption, post.hashtags || null),
    fb: withTags(post.captionFb || post.caption, post.hashtagsFb || post.hashtags || null),
    threads: withTags(
      (post.captionThreads || post.caption).slice(0, 500),
      post.hashtagsThreads || post.hashtags || null,
    ),
  };

  const options: PublishOptions = {
    igLocationId: post.igLocationId ?? undefined,
    fbPlaceId: post.fbLocationId ?? undefined,
    altText: post.altText ?? undefined,
    coverUrl: post.coverUrl ?? undefined,
    shareToFeed: post.shareToFeed,
    collaborators: post.collaborators ?? undefined,
    fbTitle: post.fbTitle ?? undefined,
    threadsReply: post.threadsReply ?? undefined,
    threadsTopic: post.threadsTopic ?? undefined,
    hideLikeCounts: post.hideLikeCounts,
    audioName: post.audioName ?? undefined,
    userTags: split(post.userTags),
    paidPartner: post.paidPartner ?? undefined,
  };

  let sent = 0;
  let failed = 0;

  for (const target of post.targets.filter((item) => item.status === "pending")) {
    const caption = target.kind.startsWith("ig_")
      ? captions.ig
      : target.kind.startsWith("fb_")
        ? captions.fb
        : captions.threads;

    const result = await publishToTarget(target.kind as SocialKind, media, caption, options);

    await prisma.socialTarget.update({
      where: { id: target.id },
      data: {
        status: result.ok ? "sent" : "failed",
        externalId: result.ok ? result.id : null,
        error: result.ok ? null : result.error.slice(0, 300),
      },
    });

    if (result.ok) sent += 1;
    else failed += 1;
  }

  const pending = await prisma.socialTarget.count({
    where: { postRefId: postId, status: "pending" },
  });

  await prisma.socialPost.update({
    where: { id: postId },
    data: { status: pending > 0 ? "scheduled" : failed > 0 ? "partial" : "published" },
  });

  return { sent, failed };
}

/** Vaqti kelgan rejalashtirilgan postlarni joylaydi */
export async function publishDuePosts(): Promise<{ posts: number; sent: number; failed: number }> {
  const due = await prisma.socialPost.findMany({
    where: { status: "scheduled", scheduledAt: { lte: new Date() } },
    select: { id: true },
    orderBy: { scheduledAt: "asc" },
    take: 20,
  });

  let sent = 0;
  let failed = 0;

  for (const post of due) {
    const result = await publishPostTargets(post.id);
    sent += result.sent;
    failed += result.failed;
  }

  return { posts: due.length, sent, failed };
}
