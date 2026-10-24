import type { Metadata } from "next";
import Link from "next/link";
import { AtSign } from "lucide-react";
import { publishSocialAction } from "@/app/actions/social";
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

const TARGETS = [
  { group: "ig", kind: "ig_reel", key: "igReel" },
  { group: "ig", kind: "ig_post", key: "igPost" },
  { group: "ig", kind: "ig_story", key: "igStory" },
  { group: "fb", kind: "fb_reel", key: "fbReel" },
  { group: "fb", kind: "fb_post", key: "fbPost" },
  { group: "fb", kind: "fb_story", key: "fbStory" },
  { group: "threads", kind: "threads_post", key: "threadsPost" },
] as const;

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

  const connected = Boolean(settings.igUserId || settings.pageId);
  const label = (key: string) => c[key as keyof typeof c] as string;

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

      {!connected && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {c.needConnection}{" "}
          <Link href="/admin/meta/kanallar" className="font-semibold underline">
            →
          </Link>
        </p>
      )}

      <form action={publishSocialAction} className="card space-y-5 p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{c.title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{c.hint}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="social-media">
              {c.mediaTitle}
            </label>
            <input
              id="social-media"
              name="media"
              type="file"
              accept="video/mp4,video/quicktime,image/*"
              required
              className="field file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            <p className="mt-1 text-[11px] text-slate-500">{c.mediaHint}</p>
          </div>

          <div>
            <label className="label" htmlFor="social-hashtags">
              {c.hashtagsTitle}
            </label>
            <input
              id="social-hashtags"
              name="hashtags"
              className="field"
              autoComplete="off"
              placeholder={c.hashtagsPlaceholder}
            />
            <p className="mt-1 text-[11px] text-slate-500">{c.hashtagsHint}</p>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="social-caption">
            {c.captionTitle}
          </label>
          <textarea
            id="social-caption"
            name="caption"
            rows={5}
            maxLength={2200}
            className="field resize-y"
            placeholder={c.captionPlaceholder}
          />
          <p className="mt-1 text-[11px] text-slate-500">{c.captionHint}</p>
        </div>

        <div>
          <label className="label" htmlFor="social-caption-fb">
            {c.fbCaptionTitle}
          </label>
          <textarea
            id="social-caption-fb"
            name="captionFb"
            rows={3}
            maxLength={5000}
            className="field resize-y"
            placeholder={c.fbCaptionPlaceholder}
          />
          <p className="mt-1 text-[11px] text-slate-500">{c.fbCaptionHint}</p>
        </div>

        <fieldset>
          <legend className="label">{c.targetsTitle}</legend>
          <p className="mb-2 text-[11px] text-slate-500">{c.targetsHint}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {(["ig", "fb", "threads"] as const).map((group) => (
              <div key={group} className="rounded-lg border border-slate-200 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  {group === "ig" ? (
                    <InstagramIcon className="size-3.5 text-[#E1306C]" />
                  ) : group === "fb" ? (
                    <MetaLogo className="size-3.5" />
                  ) : (
                    <AtSign className="size-3.5" />
                  )}
                  {group === "ig" ? c.igGroup : group === "fb" ? c.fbGroup : c.threadsGroup}
                </p>

                <div className="mt-2 space-y-1.5">
                  {TARGETS.filter((target) => target.group === group).map((target) => (
                    <label
                      key={target.kind}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        name="targets"
                        value={target.kind}
                        className="size-4 rounded border-slate-300"
                      />
                      {label(target.key)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-900">{c.extraTitle}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{c.extraHint}</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="social-location">
                {c.locationLabel}
              </label>
              <input
                id="social-location"
                name="locationId"
                className="field"
                autoComplete="off"
                inputMode="numeric"
              />
              <p className="mt-1 text-[11px] text-slate-500">{c.locationHint}</p>
            </div>

            <div>
              <label className="label" htmlFor="social-cover">
                {c.coverLabel}
              </label>
              <input
                id="social-cover"
                name="coverOffset"
                type="number"
                min={0}
                max={3600}
                className="field"
                placeholder="0"
              />
              <p className="mt-1 text-[11px] text-slate-500">{c.coverHint}</p>
            </div>

            <div>
              <label className="label" htmlFor="social-alt">
                {c.altLabel}
              </label>
              <input
                id="social-alt"
                name="altText"
                className="field"
                autoComplete="off"
                maxLength={1000}
              />
              <p className="mt-1 text-[11px] text-slate-500">{c.altHint}</p>
            </div>

            <div>
              <label className="label" htmlFor="social-collab">
                {c.collabLabel}
              </label>
              <input
                id="social-collab"
                name="collaborators"
                className="field"
                autoComplete="off"
                placeholder="@hamkor1, @hamkor2"
              />
              <p className="mt-1 text-[11px] text-slate-500">{c.collabHint}</p>
            </div>

            <div>
              <label className="label" htmlFor="social-fb-title">
                {c.fbTitleLabel}
              </label>
              <input
                id="social-fb-title"
                name="fbTitle"
                className="field"
                autoComplete="off"
                maxLength={200}
              />
              <p className="mt-1 text-[11px] text-slate-500">{c.fbTitleHint}</p>
            </div>

            <div>
              <label className="label" htmlFor="social-threads-reply">
                {c.threadsReplyLabel}
              </label>
              <select id="social-threads-reply" name="threadsReply" className="field">
                <option value="">—</option>
                <option value="everyone">{c.replyEveryone}</option>
                <option value="followers_only">{c.replyFollowers}</option>
                <option value="mentioned_only">{c.replyMentioned}</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">{c.threadsReplyHint}</p>
            </div>

            <div>
              <label className="label" htmlFor="social-threads-topic">
                {c.topicLabel}
              </label>
              <input
                id="social-threads-topic"
                name="threadsTopic"
                className="field"
                autoComplete="off"
                maxLength={50}
              />
              <p className="mt-1 text-[11px] text-slate-500">{c.topicHint}</p>
            </div>

            <div className="flex items-start gap-2 pt-6">
              <input
                id="social-share-feed"
                name="shareToFeed"
                type="checkbox"
                defaultChecked
                className="mt-0.5 size-4 rounded border-slate-300"
              />
              <label htmlFor="social-share-feed" className="text-sm text-slate-700">
                {c.shareFeedLabel}
                <span className="mt-0.5 block text-[11px] text-slate-500">{c.shareFeedHint}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary text-xs">
            {c.publish}
          </button>
          <span className="text-[11px] text-slate-500">{c.publishHint}</span>
        </div>
      </form>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">{c.recentTitle}</h2>

        {posts.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">{c.empty}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-slate-200 p-3">
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
                      className="size-16 shrink-0 rounded-md bg-slate-900 object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-800">
                      {post.caption || post.hashtags || "—"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {post.hashtags || "—"} ·{" "}
                      {new Intl.DateTimeFormat("uz-UZ", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(post.createdAt)}
                    </p>

                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {post.targets.map((target) => (
                        <span
                          key={target.id}
                          title={target.error ?? undefined}
                          className={
                            target.status === "sent"
                              ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                              : "rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700"
                          }
                        >
                          {label(
                            TARGETS.find((item) => item.kind === target.kind)?.key ?? "igPost",
                          )}
                          {target.status === "sent" ? "" : " ✕"}
                        </span>
                      ))}
                    </div>

                    {post.targets.some((target) => target.error) && (
                      <ul className="mt-1 space-y-0.5">
                        {post.targets
                          .filter((target) => target.error)
                          .map((target) => (
                            <li key={`${target.id}-err`} className="text-[11px] text-red-600">
                              {label(
                                TARGETS.find((item) => item.kind === target.kind)?.key ?? "igPost",
                              )}
                              : {target.error}
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
