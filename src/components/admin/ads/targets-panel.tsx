"use client";

import { useState } from "react";
import { toggleAdTarget } from "@/app/actions/ads";
import type { AdsCopy } from "@/lib/admin-copy/ads";
import type { AdCreative, AdTarget } from "@/lib/ads-targets";

function num(value: number, digits = 0): string {
  return value.toLocaleString("uz-UZ", { maximumFractionDigits: digits });
}

function money(value: number, currency: string): string {
  return `${num(value, 2)} ${currency}`;
}

type Reel = {
  key: string;
  creative: AdCreative;
  target: AdTarget;
};

/**
 * Lokal targetlar: kampaniya nomi va jami byudjet bir marta, har bir Reels
 * kartasida esa o'z holati, byudjeti, yoqish/pauza tugmasi va sozlamalari.
 */
export function TargetsPanel({
  targets,
  copy,
  currency,
  factor,
  objectiveLabel,
  returnTo,
}: {
  targets: AdTarget[];
  copy: AdsCopy;
  currency: string;
  factor: number;
  objectiveLabel: string;
  returnTo: string;
}) {
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [statsNotice, setStatsNotice] = useState<Record<string, boolean>>({});

  const campaign = targets[0];
  const anyActive = targets.some((target) => target.active);
  // Byudjet bitta kampaniyaniki — targetlar/videolar soniga ko'paytirilmaydi
  const campaignBudget = campaign.totalBudget / factor;

  // Bir xil video bir nechta targetda takrorlanmasin — ro'yxat bitta bo'lib qoladi
  const reels: Reel[] = [];
  const seen = new Set<string>();
  for (const target of targets) {
    for (const creative of target.creatives) {
      const key = creative.video || `${creative.headline}|${creative.link}`;
      if (seen.has(key)) continue;
      seen.add(key);
      reels.push({ key, creative, target });
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{copy.targetsTitle}</h2>

          {/* Kampaniya nomi bitta — videolar shu nom ostida ro'yxat bo'lib turadi */}
          <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">{campaign.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {objectiveLabel} · {reels.length} {copy.targetVideos} · {campaign.days}{" "}
            {copy.durationShort}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-700">
            {copy.totalBudget}: {money(campaignBudget, currency)}
          </p>

          <span
            className={
              anyActive
                ? "mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
            }
          >
            <span
              className={
                anyActive
                  ? "size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
                  : "size-1.5 rounded-full bg-slate-400"
              }
            />
            {anyActive ? copy.activeBadge : copy.paused}
          </span>
        </div>

        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {copy.totalCampaigns}: {targets.length}
        </span>
      </div>

      {/* Videolar ro'yxati — chapda muqova, kartada holat, byudjet va sozlamalar */}
      <ul className="space-y-1.5 border-t border-slate-100 px-4 py-3">
        {reels.map((reel, index) => {
          const details = openDetails[reel.key] ?? false;
          const notice = statsNotice[reel.key] ?? false;
          const daily = reel.target.dailyBudget / factor;
          const spent = reel.target.spentAmount / factor;

          return (
            <li
              key={reel.key}
              className="flex gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2"
            >
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-slate-200">
                {reel.creative.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reel.creative.thumbnail}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-[9px] font-semibold text-slate-500">
                    {copy.slotLabel} {index + 1}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-1.5">
                  <p className="min-w-0 truncate text-xs font-semibold text-slate-800">
                    {reel.creative.headline || copy.headline}
                  </p>

                  <span
                    className={
                      reel.target.active
                        ? "shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                        : "shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600"
                    }
                  >
                    {reel.target.active ? copy.inReview : copy.paused}
                  </span>
                </div>

                <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-500">
                  {reel.creative.message}
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-600">
                  <span>
                    {copy.targetDaily}: <strong className="font-semibold">{money(daily, currency)}</strong>
                  </span>
                  <span>
                    {copy.targetSpent}: <strong className="font-semibold">{money(spent, currency)}</strong>
                  </span>

                  <form action={toggleAdTarget} className="ml-auto">
                    <input type="hidden" name="id" value={reel.target.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={reel.target.active ? "PAUSED" : "ACTIVE"}
                    />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {reel.target.active ? copy.pause : copy.resume}
                    </button>
                  </form>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatsNotice((prev) => ({ ...prev, [reel.key]: !prev[reel.key] }))}
                    className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    {copy.statsButton}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenDetails((prev) => ({ ...prev, [reel.key]: !prev[reel.key] }))}
                    className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    {details ? copy.detailsHide : copy.detailsShow}
                  </button>
                </div>

                {notice && (
                  <p className="mt-1.5 rounded-md bg-amber-50 px-2 py-1 text-[10px] leading-4 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    {copy.statsUnavailable}
                  </p>
                )}

                {details && (
                  <dl className="mt-1.5 grid gap-1.5 rounded-md border border-slate-200 bg-white p-2 text-[10px] dark:border-zinc-700 dark:bg-zinc-800">
                    <div>
                      <dt className="font-semibold text-slate-500">{copy.detailHeadline}</dt>
                      <dd className="break-words text-slate-800">{reel.creative.headline || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{copy.detailMessage}</dt>
                      <dd className="whitespace-pre-line break-words text-slate-800">
                        {reel.creative.message || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{copy.detailLink}</dt>
                      <dd className="break-all text-slate-800">
                        {reel.creative.link ? (
                          <a
                            href={reel.creative.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-700 hover:underline"
                          >
                            {reel.creative.link}
                          </a>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <dt className="font-semibold text-slate-500">{copy.detailCta}</dt>
                        <dd className="text-slate-800">{reel.creative.cta || "—"}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="font-semibold text-slate-500">{copy.detailVideo}</dt>
                        <dd className="truncate">
                          {reel.creative.video ? (
                            <a
                              href={reel.creative.video}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-700 hover:underline"
                            >
                              {reel.creative.video.split("/").pop()}
                            </a>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                    </div>
                  </dl>
                )}
              </div>
            </li>
          );
        })}

        {reels.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-[10px] text-slate-500">
            {copy.creativesEmpty}
          </li>
        )}
      </ul>
    </section>
  );
}
