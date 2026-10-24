"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AtSign, Check, Loader2, MapPin, Upload, X } from "lucide-react";
import { publishSocialAction } from "@/app/actions/studio";
import { InstagramIcon } from "@/components/icons";
import { MetaLogo } from "@/components/meta-logo";
import { cn } from "@/lib/utils";
import type { studioCopy } from "@/lib/admin-copy/studio";

type Copy = typeof studioCopy.lat;
type PlatformId = "ig" | "fb" | "threads";
type Kind = "ig_reel" | "ig_post" | "ig_story" | "fb_reel" | "fb_post" | "fb_story" | "threads_post";

type Place = { id: string; name: string; place?: string };

const PLATFORMS: {
  id: PlatformId;
  kinds: { kind: Kind; key: keyof Copy }[];
  defaultKind: Kind;
}[] = [
  {
    id: "ig",
    defaultKind: "ig_post",
    kinds: [
      { kind: "ig_reel", key: "igReel" },
      { kind: "ig_post", key: "igPost" },
      { kind: "ig_story", key: "igStory" },
    ],
  },
  {
    id: "fb",
    defaultKind: "fb_post",
    kinds: [
      { kind: "fb_reel", key: "fbReel" },
      { kind: "fb_post", key: "fbPost" },
      { kind: "fb_story", key: "fbStory" },
    ],
  },
  { id: "threads", defaultKind: "threads_post", kinds: [{ kind: "threads_post", key: "threadsPost" }] },
];

function PlatformIcon({ id, className }: { id: PlatformId; className?: string }) {
  if (id === "ig") return <InstagramIcon className={className} />;
  if (id === "fb") return <MetaLogo className={className} />;
  return <AtSign className={className} />;
}

function LocationPicker({
  copy,
  label,
  idName,
  nameName,
  value,
  onChange,
}: {
  copy: Copy;
  label: string;
  idName: string;
  nameName: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setItems([]);
      setFailed(false);
      return;
    }

    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/locations?q=${encodeURIComponent(query.trim())}`);
        const data = (await response.json()) as { ok?: boolean; items?: Place[] };
        if (!alive) return;
        setItems(data.items ?? []);
        setFailed(data.ok === false);
      } catch {
        if (alive) {
          setItems([]);
          setFailed(true);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }, 400);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div>
      <p className="label">{label}</p>

      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <span className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{value.name}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
              setOpen(true);
            }}
            className="shrink-0 text-[11px] font-semibold text-brand-700 hover:underline"
          >
            {copy.locationChange}
          </button>
        </div>
      ) : open ? (
        <div className="rounded-lg border border-border bg-background">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.locationPlaceholder}
            className="w-full rounded-t-lg border-0 border-b border-border bg-transparent px-3 py-2 text-sm outline-none"
          />

          <div className="max-h-52 overflow-y-auto">
            {loading && (
              <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {copy.locationSearching}
              </p>
            )}

            {!loading && failed && (
              <p className="px-3 py-2 text-xs text-red-600">{copy.locationError}</p>
            )}

            {!loading && !failed && query.trim().length >= 2 && items.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">{copy.locationEmpty}</p>
            )}

            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate">{item.name}</span>
                  {item.place && (
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {item.place}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-accent"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
        >
          <MapPin className="size-3.5" />
          {copy.addLocation}
        </button>
      )}

      <input type="hidden" name={idName} value={value?.id ?? ""} />
      <input type="hidden" name={nameName} value={value?.name ?? ""} />
    </div>
  );
}


type TagSuggestion = { tag: string; uses: number };

function HashtagPicker({ copy }: { copy: Copy }) {
  const [tags, setTags] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [items, setItems] = useState<TagSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = value.replace(/^#+/, "").trim();
    if (!query) {
      setItems([]);
      return;
    }

    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/hashtags?q=${encodeURIComponent(query)}`);
        const data = (await response.json()) as { items?: TagSuggestion[] };
        if (alive) setItems(data.items ?? []);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [value]);

  function add(raw: string) {
    const tag = raw.replace(/^#+/, "").replace(/[\s,;]+/g, "").trim();
    if (!tag) return;
    setTags((prev) => (prev.includes(tag) || prev.length >= 30 ? prev : [...prev, tag]));
    setValue("");
    setItems([]);
  }

  const hidden = [...tags, ...(value.trim() ? [value.trim().replace(/^#+/, "")] : [])];

  return (
    <div>
      <label className="label" htmlFor="studio-hashtags">
        {copy.hashtagsTitle}
      </label>

      <div className="relative">
        <input
          id="studio-hashtags"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " " || event.key === ",") {
              event.preventDefault();
              add(value);
            } else if (event.key === "Backspace" && !value && tags.length > 0) {
              setTags((prev) => prev.slice(0, -1));
            }
          }}
          className="field"
          autoComplete="off"
          placeholder={copy.hashtagsPlaceholder}
        />

        {(items.length > 0 || loading) && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            {loading && items.length === 0 && (
              <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {copy.locationSearching}
              </p>
            )}

            {items.map((item) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => add(item.tag)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="truncate">#{item.tag}</span>
                {item.uses > 0 && (
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {item.uses} {copy.hashtagUses}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-800"
            >
              #{tag}
              <button
                type="button"
                onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                className="text-brand-700/60 hover:text-brand-800"
                aria-label={`#${tag} olib tashlash`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="mt-1 text-[11px] text-muted-foreground">{copy.hashtagsHint}</p>
      <input type="hidden" name="hashtags" value={hidden.join(" ")} />
    </div>
  );
}

function SubmitButton({ copy, count }: { copy: Copy; count: number }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || count === 0} className="btn-primary text-xs disabled:opacity-60">
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          {copy.publishing}
        </>
      ) : (
        copy.publish
      )}
    </button>
  );
}

export function StudioComposer({
  copy,
  connected,
}: {
  copy: Copy;
  connected: { ig: boolean; fb: boolean; threads: boolean };
}) {
  const [tab, setTab] = useState<PlatformId>("ig");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({ ig_post: true });
  const [igLocation, setIgLocation] = useState<Place | null>(null);
  const [fbLocation, setFbLocation] = useState<Place | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!cover) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(cover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  function pickFile(next: File | null) {
    setFile(next);
    setIsVideo(next ? next.type.startsWith("video/") : false);
  }

  const count = Object.values(selected).filter(Boolean).length;
  const platformActive = (id: PlatformId) =>
    PLATFORMS.find((platform) => platform.id === id)!.kinds.some((item) => selected[item.kind]);

  function togglePlatform(id: PlatformId) {
    const platform = PLATFORMS.find((item) => item.id === id)!;
    const next = { ...selected };
    const active = platformActive(id);

    for (const item of platform.kinds) next[item.kind] = false;
    if (!active) next[platform.defaultKind] = true;

    setSelected(next);
  }

  return (
    <form action={publishSocialAction} className="grid gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{copy.mediaTitle}</h2>
            {file && (
              <button
                type="button"
                onClick={() => pickFile(null)}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-red-600"
              >
                <X className="size-3" />
                {copy.removeFile}
              </button>
            )}
          </div>

          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const dropped = event.dataTransfer.files?.[0];
              if (dropped) pickFile(dropped);
            }}
            className={cn(
              "mt-3 flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/40 transition-colors",
              dragging ? "border-brand-700 bg-brand-50" : "border-border hover:bg-accent",
            )}
          >
            {preview ? (
              isVideo ? (
                <video src={preview} controls playsInline className="size-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="size-full object-contain" />
              )
            ) : (
              <span className="px-4 text-center">
                <Upload className="mx-auto size-6 text-muted-foreground" />
                <span className="mt-2 block text-sm font-medium text-foreground">{copy.dropTitle}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">{copy.dropHint}</span>
              </span>
            )}

            <input
              ref={inputRef}
              type="file"
              name="media"
              accept="video/mp4,video/quicktime,image/*"
              required
              className="hidden"
              onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="truncate text-[11px] text-muted-foreground">
              {file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : copy.mediaHint}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="shrink-0 text-[11px] font-semibold text-brand-700 hover:underline"
            >
              {file ? copy.replaceFile : copy.chooseFile}
            </button>
          </div>
        </div>

        <div className="card p-4">
          <HashtagPicker copy={copy} />
        </div>
      </div>

      <div className="card flex flex-col">
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          {PLATFORMS.map((platform) => {
            const active = platformActive(platform.id);
            const ready = connected[platform.id];

            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => setTab(platform.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  tab === platform.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60",
                )}
              >
                <PlatformIcon id={platform.id} className="size-4" />
                {platform.id === "ig" ? copy.igGroup : platform.id === "fb" ? copy.fbGroup : copy.threadsGroup}
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    active ? (ready ? "bg-emerald-500" : "bg-amber-500") : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-4 p-4">
          {PLATFORMS.map((platform) => {
            const active = platformActive(platform.id);
            const ready = connected[platform.id];

            return (
              <div key={platform.id} className={cn("space-y-4", tab !== platform.id && "hidden")}>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <PlatformIcon id={platform.id} className="size-4" />
                    {platform.id === "ig"
                      ? copy.enableIg
                      : platform.id === "fb"
                        ? copy.enableFb
                        : copy.enableThreads}
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      active ? "bg-brand-700" : "bg-border",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-4 rounded-full bg-white transition-all",
                        active ? "left-[1.125rem]" : "left-0.5",
                      )}
                    />
                  </button>
                </div>

                {!ready && active && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                    {copy.needConnection}
                  </p>
                )}

                <div className={cn("space-y-4", !active && "opacity-50")}>
                  <div>
                    <p className="label">{copy.formatsTitle}</p>
                    <div className="flex flex-wrap gap-2">
                      {platform.kinds.map((item) => (
                        <label
                          key={item.kind}
                          className={cn(
                            "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                            selected[item.kind]
                              ? "border-brand-700 bg-brand-50 text-brand-800"
                              : "border-border text-muted-foreground hover:bg-accent",
                          )}
                        >
                          <input
                            type="checkbox"
                            name="targets"
                            value={item.kind}
                            checked={Boolean(selected[item.kind])}
                            onChange={(event) =>
                              setSelected((prev) => ({ ...prev, [item.kind]: event.target.checked }))
                            }
                            className="sr-only"
                          />
                          {selected[item.kind] && <Check className="size-3" />}
                          {copy[item.key] as string}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor={`caption-${platform.id}`}>
                      {platform.id === "ig"
                        ? copy.igCaption
                        : platform.id === "fb"
                          ? copy.fbCaption
                          : copy.threadsCaption}
                    </label>
                    <textarea
                      id={`caption-${platform.id}`}
                      name={
                        platform.id === "ig"
                          ? "ig_caption"
                          : platform.id === "fb"
                            ? "fb_caption"
                            : "threads_caption"
                      }
                      rows={5}
                      maxLength={platform.id === "ig" ? 2200 : platform.id === "fb" ? 5000 : 500}
                      className="field resize-y"
                      placeholder={copy.captionPlaceholder}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {platform.id === "ig" ? "2200" : platform.id === "fb" ? "5000" : "500"}{" "}
                      {copy.charsSuffix}
                    </p>
                  </div>

                  {(platform.id === "ig" || platform.id === "fb") && (
                    <LocationPicker
                      copy={copy}
                      label={copy.addLocation}
                      idName={platform.id === "ig" ? "igLocation" : "fbLocation"}
                      nameName={platform.id === "ig" ? "igLocationName" : "fbLocationName"}
                      value={platform.id === "ig" ? igLocation : fbLocation}
                      onChange={platform.id === "ig" ? setIgLocation : setFbLocation}
                    />
                  )}

                  {platform.id === "ig" && (
                    <>
                      <div className="space-y-3 rounded-lg border border-border p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="label">{copy.coverLabel}</p>
                          <div className="flex items-center gap-3">
                            <label className="flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/40 hover:bg-accent">
                              {coverPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={coverPreview} alt="" className="size-full object-cover" />
                              ) : (
                                <Upload className="size-4 text-muted-foreground" />
                              )}
                              <input
                                type="file"
                                name="cover"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => setCover(event.target.files?.[0] ?? null)}
                              />
                            </label>
                            <p className="text-[11px] leading-4 text-muted-foreground">{copy.coverHint}</p>
                          </div>
                        </div>
                        <div>
                          <label className="label" htmlFor="ig-collab">
                            {copy.collabLabel}
                          </label>
                          <input
                            id="ig-collab"
                            name="collaborators"
                            className="field"
                            autoComplete="off"
                            placeholder="@hamkor1, @hamkor2"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label" htmlFor="ig-alt">
                          {copy.altLabel}
                        </label>
                        <input id="ig-alt" name="altText" className="field" autoComplete="off" maxLength={1000} />
                      </div>

                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="checkbox"
                          name="shareToFeed"
                          defaultChecked
                          className="size-4 rounded border-border"
                        />
                        <span>
                          {copy.shareFeedLabel}
                          <span className="block text-[11px] text-muted-foreground">
                            {copy.shareFeedHint}
                          </span>
                        </span>
                      </label>
                    </div>

                    <details className="rounded-lg border border-border p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-foreground">
                        {copy.moreTitle}
                      </summary>

                      <div className="mt-3 space-y-3">
                        <label className="flex items-start gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            name="hideLikeCounts"
                            className="mt-0.5 size-4 rounded border-border"
                          />
                          <span>
                            {copy.hideLikesLabel}
                            <span className="block text-[11px] text-muted-foreground">
                              {copy.hideLikesHint}
                            </span>
                          </span>
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="label" htmlFor="ig-audio">
                              {copy.audioLabel}
                            </label>
                            <input
                              id="ig-audio"
                              name="audioName"
                              className="field"
                              autoComplete="off"
                              placeholder="Original audio"
                            />
                            <p className="mt-1 text-[11px] text-muted-foreground">{copy.audioHint}</p>
                          </div>

                          <div>
                            <label className="label" htmlFor="ig-tags">
                              {copy.tagsLabel}
                            </label>
                            <input
                              id="ig-tags"
                              name="userTags"
                              className="field"
                              autoComplete="off"
                              placeholder="@kimdir, @boshqa"
                            />
                            <p className="mt-1 text-[11px] text-muted-foreground">{copy.tagsHint}</p>
                          </div>
                        </div>

                        <div>
                          <label className="label" htmlFor="ig-partner">
                            {copy.partnerLabel}
                          </label>
                          <input
                            id="ig-partner"
                            name="paidPartner"
                            className="field"
                            autoComplete="off"
                            inputMode="numeric"
                          />
                          <p className="mt-1 text-[11px] text-muted-foreground">{copy.partnerHint}</p>
                        </div>

                        <div className="rounded-lg bg-muted/60 p-2 text-[11px] leading-4 text-muted-foreground">
                          <p className="font-semibold text-foreground">{copy.appOnlyTitle}</p>
                          <p className="mt-0.5">{copy.appOnlyText}</p>
                          <p className="mt-1">{copy.storyNote}</p>
                        </div>
                      </div>
                    </details>
                    </>
                  )}

                  {platform.id === "fb" && (
                    <>
                      <div>
                        <label className="label" htmlFor="fb-title">
                          {copy.fbTitleLabel}
                        </label>
                        <input
                          id="fb-title"
                          name="fbTitle"
                          className="field"
                          autoComplete="off"
                          maxLength={200}
                        />
                        <p className="mt-1 text-[11px] text-muted-foreground">{copy.fbTitleHint}</p>
                      </div>

                      <div>
                        <label className="label" htmlFor="fb-schedule">
                          {copy.scheduleLabel}
                        </label>
                        <input
                          id="fb-schedule"
                          name="fbScheduleAt"
                          type="datetime-local"
                          className="field"
                        />
                        <p className="mt-1 text-[11px] text-muted-foreground">{copy.scheduleHint}</p>
                      </div>

                      <div className="rounded-lg bg-muted/60 p-2 text-[11px] leading-4 text-muted-foreground">
                        <p className="font-semibold text-foreground">{copy.fbAppOnlyTitle}</p>
                        <p className="mt-0.5">{copy.fbAppOnlyText}</p>
                      </div>
                    </>
                  )}

                  {platform.id === "threads" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label" htmlFor="threads-reply">
                          {copy.threadsReplyLabel}
                        </label>
                        <select id="threads-reply" name="threadsReply" className="field">
                          <option value="">{copy.replyDefault}</option>
                          <option value="everyone">{copy.replyEveryone}</option>
                          <option value="followers_only">{copy.replyFollowers}</option>
                          <option value="mentioned_only">{copy.replyMentioned}</option>
                        </select>
                      </div>
                      <div>
                        <label className="label" htmlFor="threads-topic">
                          {copy.topicLabel}
                        </label>
                        <input
                          id="threads-topic"
                          name="threadsTopic"
                          className="field"
                          autoComplete="off"
                          maxLength={50}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {count} {copy.selected}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              {count === 0 ? copy.nothingSelected : copy.publishHint}
            </span>
            <SubmitButton copy={copy} count={count} />
          </div>
        </div>
      </div>
    </form>
  );
}
