"use client";

import { useRef, useState } from "react";
import { createMetaAdCampaign } from "@/app/actions/ads";
import type { AdsCopy } from "@/lib/admin-copy/ads";
import { splitBudget } from "@/lib/ads-budget";

export type AdListing = {
  id: string;
  title: string;
  message: string;
  link: string;
  picture: string;
};

const CTA = [
  { value: "LEARN_MORE", labelKey: "ctaLearnMore" as const },
  { value: "CONTACT_US", labelKey: "ctaContactUs" as const },
  { value: "MESSAGE_PAGE", labelKey: "ctaMessage" as const },
  { value: "SIGN_UP", labelKey: "ctaSignUp" as const },
];

const LOCATIONS = [
  { key: "uz", labelKey: "locationUz" as const, min: 13_000_000, max: 15_000_000 },
  { key: "tashkent", labelKey: "locationTashkent" as const, min: 4_000_000, max: 6_000_000 },
];

type Slot = {
  id: string;
  status: "empty" | "uploading" | "ready" | "error";
  fileName: string;
  url: string;
  thumbnail: string;
  progress: number;
  error?: string;
  listingId: string;
  headline: string;
  message: string;
  link: string;
};

function createSlot(index: number): Slot {
  return {
    id: `reel-${index}`,
    status: "empty",
    fileName: "",
    url: "",
    thumbnail: "",
    progress: 0,
    listingId: "",
    headline: "",
    message: "",
    link: "",
  };
}

function money(value: number, currency: string): string {
  return `${value.toLocaleString("uz-UZ", { maximumFractionDigits: 2 })} ${currency}`;
}

/** Reels kampaniyasi: 3 video (har biri o'z e'loni bilan) → byudjet → auditoriya */
export function MetaAdBuilder({
  listings,
  copy,
  currency,
}: {
  listings: AdListing[];
  copy: AdsCopy;
  currency: string;
}) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [slots, setSlots] = useState<Slot[]>([createSlot(1), createSlot(2), createSlot(3)]);
  const [tab, setTab] = useState(0);
  const counter = useRef(0);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("housing");
  const [cta, setCta] = useState("LEARN_MORE");
  const [budget, setBudget] = useState("10");
  const [days, setDays] = useState("7");
  const [location, setLocation] = useState<{
    key: string;
    label: string;
    low: number;
    high: number;
  } | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");

  // Hisob-faktura: telefon raqam → SMS izohidagi kod → kampaniyani yaratish
  const [invoicePhase, setInvoicePhase] = useState<"idle" | "phone" | "invoice">("idle");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [invoiceCode, setInvoiceCode] = useState("");

  const budgetValue = Number(budget) || 0;
  const daysValue = Number(days) || 0;
  const total = Math.round(budgetValue * daysValue * 100) / 100;
  // Jami byudjetdan 2% soliq ushlanadi, qolgani targetga ketadi
  const split = splitBudget(total * 100);
  const tax = split.tax / 100;
  const netTotal = split.net / 100;

  const readySlots = slots.filter((slot) => slot.status === "ready");
  const uploading = slots.some((slot) => slot.status === "uploading");
  const current = slots[tab];

  function patchSlot(index: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  function pickListing(index: number, value: string) {
    const listing = listings.find((item) => item.id === value);
    if (!listing) {
      patchSlot(index, { listingId: value });
      return;
    }

    patchSlot(index, {
      listingId: value,
      headline: listing.title.slice(0, 90),
      message: listing.message,
      link: listing.link,
    });
  }

  function uploadVideo(index: number, file: File) {
    if (!/^video\/(mp4|quicktime)$/.test(file.type)) {
      patchSlot(index, { status: "error", error: copy.videoFormat });
      return;
    }

    counter.current += 1;
    patchSlot(index, {
      status: "uploading",
      fileName: file.name,
      progress: 0,
      error: undefined,
    });

    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/ads/video");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        patchSlot(index, { progress: Math.round((event.loaded / event.total) * 100) });
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as {
          ok?: boolean;
          url?: string;
          thumbnail?: string;
          error?: string;
        };

        if (xhr.status === 200 && data.ok && data.url && data.thumbnail) {
          patchSlot(index, {
            status: "ready",
            url: data.url,
            thumbnail: data.thumbnail,
            progress: 100,
          });
        } else {
          patchSlot(index, { status: "error", error: data.error ?? copy.videoFailed });
        }
      } catch {
        patchSlot(index, { status: "error", error: copy.videoFailed });
      }
    };

    xhr.onerror = () => patchSlot(index, { status: "error", error: copy.videoFailed });
    xhr.send(form);
  }

  function pickLocation(item: (typeof LOCATIONS)[number]) {
    const span = item.max - item.min;
    const low = item.min + Math.floor(Math.random() * span * 0.6);
    const high = Math.min(
      item.max,
      low + Math.floor(span * 0.15) + Math.floor(Math.random() * span * 0.2),
    );

    setLocation({ key: item.key, label: copy[item.labelKey], low, high });
    setLocationOpen(false);
    setLocationQuery("");
  }

  function invalidStep(): number | null {
    if (slots.some((slot) => slot.status !== "ready")) return 1;
    if (name.trim().length < 3) return 1;
    if (
      slots.some(
        (slot) =>
          slot.headline.trim().length < 3 ||
          slot.message.trim().length < 5 ||
          !/^https?:\/\//i.test(slot.link.trim()),
      )
    ) {
      return 1;
    }
    if (budgetValue < 1 || budgetValue > 10_000 || daysValue < 1 || daysValue > 90) return 2;
    if (!location) return 3;
    return null;
  }

  function startInvoice() {
    if (uploading) {
      setError(copy.videoUploading);
      return;
    }

    const invalid = invalidStep();
    if (invalid !== null) {
      setStep(invalid);
      setError(invalid === 3 && !location ? copy.locationRequired : copy.invalid);
      return;
    }

    setError(null);
    setInvoicePhase("phone");
  }

  function submitPhone() {
    if (phone.replace(/\D/g, "").length < 9) {
      setPhoneError(copy.phoneInvalid);
      return;
    }

    setPhoneError(null);
    setInvoiceCode(`KN-${1000 + Math.floor(Math.random() * 9000)}`);
    setInvoicePhase("invoice");
  }

  function guardSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (uploading) {
      event.preventDefault();
      setError(copy.videoUploading);
      return;
    }

    const invalid = invalidStep();
    if (invalid === null) {
      setError(null);
      return;
    }

    event.preventDefault();
    setStep(invalid);
    setError(invalid === 3 && !location ? copy.locationRequired : copy.invalid);
  }

  const steps = [
    { value: 1, label: copy.stepCreative },
    { value: 2, label: copy.stepBudget },
    { value: 3, label: copy.stepAudience },
  ];

  const ctaLabel = copy[CTA.find((item) => item.value === cta)?.labelKey ?? "ctaLearnMore"];

  return (
    <form action={createMetaAdCampaign} onSubmit={guardSubmit} noValidate className="mt-3 space-y-4">
      <input type="hidden" name="currency" value={currency} />

      {slots.map((slot) => (
        <span key={slot.id}>
          <input type="hidden" name="video" value={slot.url} />
          <input type="hidden" name="videoThumb" value={slot.thumbnail} />
          <input type="hidden" name="listingId" value={slot.listingId} />
          <input type="hidden" name="headline" value={slot.headline} />
          <input type="hidden" name="message" value={slot.message} />
          <input type="hidden" name="link" value={slot.link} />
        </span>
      ))}

      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((item) => {
          const done = item.value < step;
          const active = item.value === step;

          return (
            <li key={item.value}>
              <button
                type="button"
                onClick={() => setStep(item.value)}
                className={
                  active
                    ? "flex items-center gap-1.5 rounded-full bg-brand-800 px-3 py-1 text-[11px] font-semibold text-white"
                    : done
                      ? "flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700"
                      : "flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
                }
              >
                <span
                  className={
                    active
                      ? "grid size-4 place-items-center rounded-full bg-white/20 text-[10px]"
                      : "grid size-4 place-items-center rounded-full bg-white text-[10px] text-slate-600 dark:bg-zinc-700 dark:text-zinc-100"
                  }
                >
                  {done ? "✓" : item.value}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ol>

      {/* 1-qadam: uchta Reels va ularning e'lonlari */}
      <div className={step === 1 ? "grid gap-3 lg:grid-cols-[1fr_250px]" : "hidden"}>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">{copy.adName}</span>
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              placeholder={copy.adNamePlaceholder}
              className="field"
            />
          </label>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-slate-600">
                {copy.videoTitle} · {readySlots.length}/3
              </span>
              <span className="text-[10px] text-slate-400">{copy.videoFormat}</span>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {slots.map((slot, index) => {
                const isActive = index === tab;
                const dot =
                  slot.status === "ready"
                    ? "bg-emerald-500"
                    : slot.status === "error"
                      ? "bg-red-500"
                      : slot.status === "uploading"
                        ? "bg-amber-500"
                        : "bg-slate-300";

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setTab(index)}
                    className={
                      isActive
                        ? "flex items-center justify-center gap-1.5 rounded-lg border border-brand-500 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-800 dark:bg-zinc-800 dark:text-zinc-100"
                        : "flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-card px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                    }
                  >
                    <span className={`size-1.5 rounded-full ${dot}`} />
                    {copy.slotLabel} {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 rounded-xl border border-slate-200 p-3">
              {current.status === "ready" ? (
                <>
                  <div className="flex items-center gap-2">
                    <video
                      src={current.url}
                      className="size-12 shrink-0 rounded bg-black object-cover"
                      muted
                      playsInline
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-slate-700">
                        {current.fileName}
                      </span>
                      <span className="block text-[10px] text-emerald-600">{copy.videoReady}</span>
                    </span>

                    <label className="cursor-pointer text-[10px] font-semibold text-slate-600 hover:underline">
                      {copy.slotReplace}
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) uploadVideo(tab, file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <div className="mt-3 space-y-2">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                        {copy.listing}
                      </span>
                      <select
                        value={current.listingId}
                        onChange={(event) => pickListing(tab, event.target.value)}
                        className="field"
                      >
                        <option value="">{copy.chooseListing}</option>
                        {listings.map((listing) => (
                          <option key={listing.id} value={listing.id}>
                            {listing.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                        {copy.headline}
                      </span>
                      <input
                        maxLength={100}
                        value={current.headline}
                        onChange={(event) => patchSlot(tab, { headline: event.target.value })}
                        className="field"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                        {copy.message}
                      </span>
                      <textarea
                        maxLength={500}
                        rows={2}
                        value={current.message}
                        onChange={(event) => patchSlot(tab, { message: event.target.value })}
                        className="field resize-y"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                        {copy.link}
                      </span>
                      <input
                        value={current.link}
                        onChange={(event) => patchSlot(tab, { link: event.target.value })}
                        className="field"
                      />
                    </label>
                  </div>
                </>
              ) : current.status === "uploading" ? (
                <div>
                  <p className="text-[11px] font-medium text-slate-700">{current.fileName}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all"
                      style={{ width: `${current.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {copy.videoUploading} {current.progress}%
                  </p>
                </div>
              ) : (
                <div>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-6 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) uploadVideo(tab, file);
                        event.target.value = "";
                      }}
                    />
                    {copy.slotUpload}
                    <span className="text-[10px] font-normal text-slate-400">
                      {copy.videoFormat}
                    </span>
                  </label>

                  {current.status === "error" && current.error && (
                    <p className="mt-1 text-[10px] text-red-600">{current.error}</p>
                  )}
                </div>
              )}
            </div>

            <p className="mt-1 text-[10px] leading-4 text-slate-500">{copy.perReelHint}</p>
          </div>
        </div>

        {/* Ko'rinish: tanlangan Reels qanday chiqadi */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              {copy.preview}
            </p>
            <span className="text-[10px] font-medium text-slate-500">
              {copy.slotLabel} {tab + 1}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-black">
            {current.status === "ready" ? (
              <video
                key={current.url}
                src={current.url}
                className="aspect-[9/16] w-full object-cover"
                muted
                loop
                playsInline
                controls
              />
            ) : (
              <div className="grid aspect-[9/16] place-items-center bg-slate-100 px-3 text-center text-[10px] text-slate-400">
                {copy.videoEmpty}
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2.5 pt-8 text-white">
              <p className="truncate text-[9px] text-white/70">
                {current.link.replace(/^https?:\/\//, "").split("/")[0] || "tezsotamiz.uz"}
              </p>
              <p className="line-clamp-2 text-[11px] font-semibold">
                {current.headline || copy.headline}
              </p>
              <p className="line-clamp-2 text-[9px] leading-3 text-white/80">
                {current.message || copy.message}
              </p>
              <span className="mt-1 inline-block rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-900 dark:bg-zinc-900/90 dark:text-zinc-100">
                {ctaLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-qadam: maqsad va byudjet */}
      <div className={step === 2 ? "space-y-3" : "hidden"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">{copy.objective}</span>
            <select name="objective" defaultValue="OUTCOME_TRAFFIC" className="field">
              <option value="OUTCOME_TRAFFIC">{copy.objTraffic}</option>
              <option value="OUTCOME_AWARENESS">{copy.objAwareness}</option>
              <option value="OUTCOME_ENGAGEMENT">{copy.objEngagement}</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">{copy.category}</span>
            <select
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="field"
            >
              <option value="housing">{copy.catHousing}</option>
              <option value="finance">{copy.catFinance}</option>
              <option value="leads">{copy.catLeads}</option>
              <option value="assets">{copy.catAssets}</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">{copy.cta}</span>
            <select
              name="cta"
              value={cta}
              onChange={(event) => setCta(event.target.value)}
              className="field"
            >
              {CTA.map((item) => (
                <option key={item.value} value={item.value}>
                  {copy[item.labelKey]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">
              {copy.dailyBudget} ({currency})
            </span>
            <input
              name="budget"
              type="number"
              min={1}
              max={10000}
              step="0.01"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className="field"
            />
            <span className="mt-1 block text-[10px] text-slate-500">{copy.budgetHint}</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">{copy.duration}</span>
            <input
              name="days"
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(event) => setDays(event.target.value)}
              className="field"
            />
          </label>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2">
          <p className="text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
            {copy.totalBudget}
          </p>
          <p className="mt-0.5 text-sm font-bold text-slate-900">{money(total, currency)}</p>
          <p className="text-[10px] text-slate-600">
            {money(budgetValue, currency)} × {daysValue || 0} {copy.durationShort}
          </p>

          <dl className="mt-1.5 space-y-0.5 border-t border-slate-200 pt-1.5 text-[10px] dark:border-zinc-700">
            <div className="flex items-center justify-between gap-2 text-slate-600">
              <dt>{copy.budgetTax}</dt>
              <dd>−{money(tax, currency)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2 font-semibold text-slate-800">
              <dt>{copy.budgetNet}</dt>
              <dd>{money(netTotal, currency)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 3-qadam: auditoriya */}
      <div className={step === 3 ? "space-y-3" : "hidden"}>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-600">{copy.locationTitle}</span>

            {!location && !locationOpen && (
              <button
                type="button"
                onClick={() => setLocationOpen(true)}
                className="text-[11px] font-semibold text-brand-700 hover:underline"
              >
                + {copy.locationAdd}
              </button>
            )}
          </div>

          {location ? (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {location.label}
                <button
                  type="button"
                  onClick={() => setLocation(null)}
                  aria-label={copy.locationRemove}
                  className="text-slate-400 hover:text-red-600"
                >
                  ×
                </button>
              </span>

              <p className="mt-2 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                {copy.estimateTitle}
              </p>
              <p className="text-sm font-bold text-slate-900">
                {location.low.toLocaleString("uz-UZ")} – {location.high.toLocaleString("uz-UZ")}
              </p>

              <input type="hidden" name="location" value={location.key} />
            </div>
          ) : locationOpen ? (
            <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800">
              <input
                autoFocus
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder={copy.locationPlaceholder}
                className="field"
              />

              <ul className="mt-1 divide-y divide-slate-100">
                {LOCATIONS.filter((item) =>
                  copy[item.labelKey].toLowerCase().includes(locationQuery.trim().toLowerCase()),
                ).map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => pickLocation(item)}
                      className="w-full px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {copy[item.labelKey]}
                    </button>
                  </li>
                ))}

                {LOCATIONS.filter((item) =>
                  copy[item.labelKey].toLowerCase().includes(locationQuery.trim().toLowerCase()),
                ).length === 0 && (
                  <li className="px-2 py-1.5 text-[11px] text-slate-500">{copy.locationNotFound}</li>
                )}
              </ul>

              <button
                type="button"
                onClick={() => {
                  setLocationOpen(false);
                  setLocationQuery("");
                }}
                className="mt-1 text-[10px] font-semibold text-slate-500"
              >
                {copy.stepBack}
              </button>
            </div>
          ) : (
            <p className="mt-1 text-[10px] text-slate-500">{copy.locationEmpty}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">
              {copy.age} (dan)
            </span>
            <input name="ageMin" type="number" min={18} max={65} defaultValue={18} className="field" />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">
              {copy.age} (gacha)
            </span>
            <input name="ageMax" type="number" min={18} max={65} defaultValue={55} className="field" />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">{copy.gender}</span>
            <select name="gender" defaultValue="all" className="field">
              <option value="all">{copy.genderAll}</option>
              <option value="male">{copy.genderMale}</option>
              <option value="female">{copy.genderFemale}</option>
            </select>
          </label>
        </div>

        <dl className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">{copy.adName}</dt>
            <dd className="truncate font-semibold text-slate-800">{name || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{copy.dailyBudget}</dt>
            <dd className="font-semibold text-slate-800">{money(budgetValue, currency)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{copy.totalBudget}</dt>
            <dd className="font-semibold text-slate-800">{money(total, currency)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{copy.budgetTax}</dt>
            <dd className="font-semibold text-slate-800">−{money(tax, currency)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{copy.budgetNet}</dt>
            <dd className="font-semibold text-slate-800">{money(netTotal, currency)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{copy.structure}</dt>
            <dd className="font-semibold text-slate-800">{copy.structureValue}</dd>
          </div>
        </dl>

        {location && (
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {copy.locationTitle}: <strong className="text-slate-800">{location.label}</strong> ·{" "}
            {copy.estimateTitle}:{" "}
            <strong className="text-slate-800">
              {location.low.toLocaleString("uz-UZ")} – {location.high.toLocaleString("uz-UZ")}
            </strong>
          </p>
        )}

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-[10px] leading-4 text-slate-600">
          {copy.reelsTargeting}
        </p>

        <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <input type="checkbox" name="active" value="1" className="mt-0.5" />
          <span>
            <span className="block text-xs font-semibold text-slate-700">{copy.activate}</span>
            <span className="block text-[10px] text-slate-500">{copy.activateHint}</span>
          </span>
        </label>

        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="invoiceCode" value={invoiceCode} />

        {invoicePhase === "idle" && (
          <button
            type="button"
            onClick={startInvoice}
            disabled={uploading}
            className="btn-primary w-full text-xs disabled:opacity-50 sm:w-auto"
          >
            {uploading ? copy.videoUploading : copy.launch}
          </button>
        )}

        {invoicePhase === "phone" && (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-800">{copy.phonePromptTitle}</p>
            <p className="text-[11px] leading-4 text-slate-500">{copy.phonePromptHint}</p>
            <input
              autoFocus
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitPhone();
                }
              }}
              placeholder={copy.phonePlaceholder}
              className="field"
            />
            {phoneError && <p className="text-[11px] text-red-600">{phoneError}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInvoicePhase("idle")}
                className="btn-secondary text-xs"
              >
                {copy.stepBack}
              </button>
              <button type="button" onClick={submitPhone} className="btn-primary text-xs">
                {copy.phoneSend}
              </button>
            </div>
          </div>
        )}

        {invoicePhase === "invoice" && (
          <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/40 dark:bg-emerald-500/10">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {copy.invoiceTitle}
            </p>
            <p className="text-[11px] leading-5 text-emerald-900/85 dark:text-emerald-200/85">
              {copy.invoiceText}
            </p>
            <p className="rounded-lg bg-white px-3 py-2 text-center font-mono text-lg font-bold tracking-[0.2em] text-slate-900 dark:bg-zinc-900 dark:text-zinc-50">
              {invoiceCode}
            </p>
            <p className="text-[10px] leading-4 text-emerald-900/75 dark:text-emerald-200/75">
              {copy.invoiceNote}
            </p>
            <button
              type="submit"
              disabled={uploading}
              className="btn-primary w-full text-xs disabled:opacity-50 sm:w-auto"
            >
              {uploading ? copy.videoUploading : copy.invoiceCreate}
            </button>
          </div>
        )}

        <p className="text-[10px] leading-4 text-slate-500">{copy.wizardNote}</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(1, value - 1))}
          disabled={step === 1}
          className="btn-secondary text-xs disabled:opacity-40"
        >
          {copy.stepBack}
        </button>

        {step < 3 && (
          <button
            type="button"
            onClick={() => setStep((value) => Math.min(3, value + 1))}
            className="btn-primary text-xs"
          >
            {copy.stepNext}
          </button>
        )}
      </div>
    </form>
  );
}
