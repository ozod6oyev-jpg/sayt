import type { Metadata } from "next";
import Link from "next/link";
import { AtSign } from "lucide-react";
import { StudioComposer } from "@/components/admin/studio-composer";
import { InstagramIcon } from "@/components/icons";
import { MetaLogo } from "@/components/meta-logo";
import { studioCopy } from "@/lib/admin-copy/studio";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";
import { getMetaSettings } from "@/lib/meta";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Studio | Boshqaruv paneli",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const KIND_LABEL: Record<string, string> = {
  ig_reel: "Reels",
  ig_post: "Post",
  ig_story: "Story",
  fb_reel: "Reels",
  fb_post: "Post",
  fb_story: "Story",
  threads_post: "Threads",
};

function PlatformBadge({ platform }: { platform: "ig" | "fb" | "threads" }) {
  if (platform === "ig") return <InstagramIcon className="size-3.5 text-[#E1306C]" />;
  if (platform === "fb") return <MetaLogo className="size-3.5" />;
  return <AtSign className="size-3.5" />;
}

export default async function StudioPage({ searchParams }: PageProps) {
  await requireOwner();

  const c = await getAdminCopy(studioCopy);
  const params = await searchParams;
  const status = first(params.post);

  const [settings, posts] = await Promise.all([
    getMetaSettings(),
    prisma.socialPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { targets: true },
    }),
  ]);

  const connected = {
    ig: Boolean(settings.igUserId && settings.pageToken),
    fb: Boolean(settings.pageId && settings.pageToken),
    threads: Boolean(settings.threadsUserId && settings.threadsToken),
  };

  const banner =
    status === "ok"
      ? { tone: "ok" as const, text: c.sent }
      : status === "partial"
        ? { tone: "error" as const, text: c.partial }
        : status === "invalid"
          ? { tone: "error" as const, text: c.invalid }
          : status === "media"
            ? { tone: "error" as const, text: c.mediaError }
            : status === "long"
              ? { tone: "error" as const, text: c.long }
              : null;

  return (
    <div className="space-y-5">
      {banner && (
        <p
          className={
            banner.tone === "ok"
              ? "rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {banner.text}
        </p>
      )}

      {!connected.ig && !connected.fb && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {c.needConnection}{" "}
          <Link href="/admin/meta/kanallar" className="font-semibold underline">
            →
          </Link>
        </p>
      )}

      <div>
        <h1 className="text-lg font-semibold text-foreground">{c.title}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">{c.hint}</p>
      </div>

      <StudioComposer copy={c} connected={connected} />

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-foreground">{c.recentTitle}</h2>

        {posts.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">{c.empty}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-border p-3">
                <div className="flex gap-3">
                  {post.mediaType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.mediaUrl}
                      alt=""
                      className="size-16 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <video
                      src={post.mediaUrl}
                      muted
                      playsInline
                      className="size-16 shrink-0 rounded-md bg-neutral-900 object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {post.caption || post.captionFb || post.captionThreads || "—"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {[
                        ...new Set(
                          [post.hashtags, post.hashtagsFb, post.hashtagsThreads]
                            .filter(Boolean)
                            .join(" ")
                            .split(" ")
                            .filter(Boolean),
                        ),
                      ].join(" ") || "—"}{" "}
                      ·{" "}
                      {new Intl.DateTimeFormat("uz-UZ", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(post.createdAt)}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {post.targets.map((target) => (
                        <span
                          key={target.id}
                          title={target.error ?? undefined}
                          className={
                            target.status === "sent"
                              ? "flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                              : "flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700"
                          }
                        >
                          <PlatformBadge
                            platform={
                              target.kind.startsWith("ig_")
                                ? "ig"
                                : target.kind.startsWith("fb_")
                                  ? "fb"
                                  : "threads"
                            }
                          />
                          {KIND_LABEL[target.kind] ?? target.kind}
                          {target.status !== "sent" && " ✕"}
                        </span>
                      ))}
                    </div>

                    {post.targets.some((target) => target.error) && (
                      <ul className="mt-1 space-y-0.5">
                        {post.targets
                          .filter((target) => target.error)
                          .map((target) => (
                            <li key={`${target.id}-err`} className="text-[11px] text-red-600">
                              {KIND_LABEL[target.kind] ?? target.kind}: {target.error}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
