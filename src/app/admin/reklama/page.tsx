import Link from "next/link";
import {
  saveMetaAdsSettings,
  selectAdAccount,
  testMetaAdsConnection,
  toggleAdStatus,
} from "@/app/actions/ads";
import { AdsChart } from "@/components/admin/ads/ads-chart";
import { FlashBanners } from "@/components/admin/flash-banners";
import { CollapsibleSection } from "@/components/admin/collapsible-section";
import { InfoHint } from "@/components/admin/info-hint";
import { MetaAdBuilder, type AdListing } from "@/components/admin/ads/meta-ad-builder";
import { TargetsPanel } from "@/components/admin/ads/targets-panel";
import { MetaLogo } from "@/components/meta-logo";
import { adsCopy, type AdsCopy } from "@/lib/admin-copy/ads";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";
import { getMetaSettings } from "@/lib/meta";
import {
  checkAdAccount,
  getAdsSummary,
  getDailyInsights,
  listAdAccounts,
  listAudiences,
  listCampaigns,
  minorUnitFactor,
} from "@/lib/meta-ads";
import { prisma } from "@/lib/prisma";
import { getAdsWallet, listTargets, type AdTarget } from "@/lib/ads-targets";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const DATE_PRESETS = [
  { value: "today", key: "dateToday" },
  { value: "yesterday", key: "dateYesterday" },
  { value: "last_7d", key: "date7" },
  { value: "last_30d", key: "date30" },
  { value: "this_month", key: "dateMonth" },
] as const;

const OBJECTIVE_KEY: Record<string, keyof AdsCopy> = {
  OUTCOME_TRAFFIC: "objTraffic",
  LINK_CLICKS: "objTraffic",
  OUTCOME_AWARENESS: "objAwareness",
  REACH: "objAwareness",
  OUTCOME_ENGAGEMENT: "objEngagement",
  POST_ENGAGEMENT: "objEngagement",
};

function num(value: number, digits = 0): string {
  return value.toLocaleString("uz-UZ", { maximumFractionDigits: digits });
}

/** Ad account ID va tokenni qo'lda kiritish — bir bosishli ulash ishlamaganda ham ochiq */
function CredentialsForm({
  c,
  summary,
}: {
  c: AdsCopy;
  summary: { adAccountId: string | null; hasToken: boolean };
}) {
  return (
    <>
      <form action={saveMetaAdsSettings} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-600">{c.adAccountId}</span>
          <input
            name="adAccountId"
            defaultValue={summary.adAccountId ?? ""}
            placeholder={c.adAccountPlaceholder}
            className="field"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-600">{c.adsToken}</span>
          <input
            name="adsToken"
            type="password"
            autoComplete="off"
            placeholder={summary.hasToken ? "••••••••" : ""}
            className="field"
          />
          <span className="mt-1 block text-[10px] text-slate-500">{c.adsTokenHint}</span>
        </label>

        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary text-xs">
            {c.save}
          </button>
        </div>
      </form>

      <form action={testMetaAdsConnection} className="mt-2">
        <button type="submit" className="btn-secondary text-xs">
          {c.test}
        </button>
      </form>
    </>
  );
}

function ManualSteps({ c }: { c: AdsCopy }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-[11px] font-semibold text-slate-700">{c.manualTitle}</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4 text-[10px] leading-4 text-slate-500">
          <li>{c.manualStep1}</li>
          <li>{c.manualStep2}</li>
          <li>{c.manualStep3}</li>
          <li>{c.manualStep4}</li>
        </ol>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-[11px] font-semibold text-slate-700">{c.scopeTitle}</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4 text-[10px] leading-4 text-slate-500">
          <li>{c.scopeStep1}</li>
          <li>{c.scopeStep2}</li>
          <li>{c.scopeStep3}</li>
          <li>{c.scopeStep4}</li>
        </ol>
      </div>
    </div>
  );
}

export default async function AdsPage({ searchParams }: PageProps) {
  await requireOwner();

  const c = await getAdminCopy(adsCopy);
  const params = await searchParams;
  const channel = first(params.kanal) === "google" ? "google" : "meta";
  const dateParam = first(params.d);
  const datePreset = DATE_PRESETS.find((item) => item.value === dateParam)?.value ?? "last_7d";

  const banners: { tone: "ok" | "error"; text: string }[] = [];
  if (first(params.ads) === "saved") banners.push({ tone: "ok", text: c.saved });
  if (first(params.ads) === "invalid") banners.push({ tone: "error", text: c.invalidSettings });
  if (first(params.ads) === "connected") banners.push({ tone: "ok", text: c.adsConnected });
  if (first(params.ads) === "none") banners.push({ tone: "error", text: c.adsNone });
  if (first(params.ads) === "error") banners.push({ tone: "error", text: c.adsConnectError });
  if (first(params.ads) === "state") banners.push({ tone: "error", text: c.adsConnectState });
  if (first(params.account) === "saved") banners.push({ tone: "ok", text: c.accountSaved });
  if (first(params.adsCheck) === "ok") banners.push({ tone: "ok", text: c.checkOk });
  if (first(params.adsCheck) === "error") banners.push({ tone: "error", text: c.checkError });
  if (first(params.ad) === "created") banners.push({ tone: "ok", text: c.created });
  if (first(params.ad) === "invalid") banners.push({ tone: "error", text: c.invalid });
  if (first(params.ad) === "error") banners.push({ tone: "error", text: c.failed });
  if (first(params.ad) === "payment") banners.push({ tone: "error", text: c.paymentError });
  if (first(params.holat) === "ok") banners.push({ tone: "ok", text: c.updated });
  if (first(params.holat) === "budget") banners.push({ tone: "ok", text: c.budgetSaved });
  if (first(params.holat) === "error") banners.push({ tone: "error", text: c.updateFailed });
  if (first(params.holat) === "invalid") banners.push({ tone: "error", text: c.invalid });

  const [summary, metaSettings, listings] = await Promise.all([
    getAdsSummary(),
    getMetaSettings(),
    prisma.listing.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
    }),
  ]);

  const accounts = summary.hasToken ? await listAdAccounts() : null;
  const connected = Boolean(summary.adAccountId && summary.hasToken);

  const [account, campaigns, audiences, daily, targets] = connected
    ? await Promise.all([
        checkAdAccount(),
        listCampaigns(summary.adAccountId as string, datePreset),
        listAudiences(summary.adAccountId as string),
        getDailyInsights(summary.adAccountId as string, datePreset),
        listTargets(),
      ])
    : [null, null, null, null, [] as AdTarget[]];

  const currency = account?.ok ? account.result.currency : "USD";
  const rows = campaigns?.ok ? campaigns.result : [];
  const audienceRows = audiences?.ok ? audiences.result : [];
  const dailyRows = daily?.ok ? daily.result : [];

  const kpi = rows.reduce(
    (acc, row) => ({
      spend: acc.spend + row.insights.spend,
      impressions: acc.impressions + row.insights.impressions,
      clicks: acc.clicks + row.insights.clicks,
      reach: acc.reach + row.insights.reach,
    }),
    { spend: 0, impressions: 0, clicks: 0, reach: 0 },
  );

  // Lokal targetlar hisobi (minimal birlik → valyuta)
  const targetFactor = minorUnitFactor(currency);
  const targetSpent = targets.reduce((sum, target) => sum + target.spentAmount, 0) / targetFactor;

  // Hamyon: to'langan so'm → dollar. Soliq target yoqilganda ajratiladi, undan keyin kunlik sarf yechiladi
  const wallet = await getAdsWallet();
  const walletLeft = Math.max(wallet.usd - (wallet.taxCharged ? wallet.taxUsd : 0) - targetSpent, 0);

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const adListings: AdListing[] = listings.map((listing) => ({
    id: listing.id,
    title: listing.titleUz,
    message: `${listing.titleUz} — ${listing.district}, ${listing.region}. Batafsil:`,
    link: `${base}/uz/elonlar/${listing.slug}`,
    picture: listing.photos[0]?.url ? `${base}${listing.photos[0].url}` : "",
  }));

  const selfQuery = `/admin/reklama?d=${datePreset}`;

  const kpiCards = [
    {
      label: c.kpiSpend,
      value: `${num(kpi.spend + targetSpent, 2)} ${currency}`,
      hint: c.kpiSpendHint,
      accent: true,
    },
    { label: c.kpiImpressions, value: num(kpi.impressions), hint: c.kpiImpressionsHint },
    { label: c.kpiClicks, value: num(kpi.clicks), hint: c.kpiClicksHint },
    {
      label: c.kpiCtr,
      value: `${num(kpi.impressions ? (kpi.clicks / kpi.impressions) * 100 : 0, 2)}%`,
      hint: c.kpiCtrHint,
    },
    {
      label: c.kpiCpc,
      value: `${num(kpi.clicks ? kpi.spend / kpi.clicks : 0, 2)} ${currency}`,
      hint: c.kpiCpcHint,
    },
    {
      label: c.kpiCpm,
      value: `${num(kpi.impressions ? (kpi.spend / kpi.impressions) * 1000 : 0, 2)} ${currency}`,
      hint: c.kpiCpmHint,
    },
    { label: c.kpiReach, value: num(kpi.reach), hint: c.kpiReachHint },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{c.title}</h1>
        <p className="mt-0.5 text-sm text-slate-500">{c.subtitle}</p>
      </div>

      <FlashBanners items={banners} />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/reklama"
          className={
            channel === "meta"
              ? "rounded-full bg-brand-800 px-3 py-1 text-xs font-semibold text-white"
              : "rounded-full border border-slate-200 bg-card px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          }
        >
          <MetaLogo className="mr-1 inline size-3.5" />
          {c.tabMeta}
        </Link>
        <Link
          href="/admin/reklama?kanal=google"
          className={
            channel === "google"
              ? "rounded-full bg-brand-800 px-3 py-1 text-xs font-semibold text-white"
              : "rounded-full border border-slate-200 bg-card px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          }
        >
          <span aria-hidden className="mr-1 text-sm leading-none">
            🔍
          </span>
          {c.tabGoogle}
        </Link>
      </div>

      {channel === "google" ? (
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <span aria-hidden className="text-base leading-none">
                🔍
              </span>
              {c.googleTitle}
            </h2>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {c.googleSoon}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{c.googleHint}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { label: c.googleCustomerId, value: "123-456-7890" },
              { label: c.googleLoginId, value: "123-456-7890" },
              { label: c.googleDevToken, value: "••••••••••••" },
              { label: c.googleClientId, value: "000000000000.apps.googleusercontent.com" },
            ].map((field) => (
              <label key={field.label} className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                  {field.label}
                </span>
                <input disabled value={field.value} className="field opacity-60" />
              </label>
            ))}
          </div>

          <button type="button" disabled className="btn-secondary mt-4 text-xs opacity-60">
            {c.save}
          </button>
          <p className="mt-2 text-[10px] text-slate-500">{c.googleNote}</p>
        </section>
      ) : (
        <>
          {connected ? (
            <section className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0866FF]/10">
                    <MetaLogo className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {account?.ok ? account.result.name : `act_${summary.adAccountId}`}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <span
                        title={c.walletHint}
                        className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700"
                      >
                        {c.budgetBadge}: {num(walletLeft, 2)} USD
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                        {c.connected}
                      </span>
                      <span>{currency}</span>
                      {account?.ok && <span>· {account.result.status}</span>}
                      {account?.ok && account.result.timezone && <span>· {account.result.timezone}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {DATE_PRESETS.map((preset) => (
                      <Link
                        key={preset.value}
                        href={`/admin/reklama?d=${preset.value}`}
                        className={
                          datePreset === preset.value
                            ? "rounded-full bg-brand-800 px-2.5 py-1 text-[11px] font-semibold text-white"
                            : "rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                        }
                      >
                        {c[preset.key]}
                      </Link>
                    ))}
                  </div>

                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {kpiCards.map((item) => (
                  <div
                    key={item.label}
                    className={
                      item.accent
                        ? "rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5"
                        : "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                    }
                  >
                    <dt className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                      {item.label}
                      <InfoHint text={item.hint} />
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold text-slate-800">{item.value}</dd>
                  </div>
                ))}
              </dl>

              {account && !account.ok && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {account.description}
                </p>
              )}

              {campaigns && !campaigns.ok && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {campaigns.description || c.apiFail}
                </p>
              )}
            </section>
          ) : (
            <section className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <MetaLogo className="size-4" />
                  {c.connectTitle}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {c.notConnected}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-4">
                <p className="text-xs leading-5 text-slate-700">{c.connectWithMeta}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">{c.connectMetaHint}</p>
                <a href="/api/meta/oauth/start?mode=ads" className="btn-primary mt-3 inline-flex text-xs">
                  <MetaLogo className="size-3.5" />
                  {c.connectWithMeta}
                </a>
                <p className="mt-2 rounded-lg bg-white/70 px-2 py-1.5 text-[10px] leading-4 text-slate-600 dark:bg-zinc-900/70 dark:text-zinc-300">
                  {c.connectMetaWarn}
                </p>
              </div>

              <ManualSteps c={c} />
              <CredentialsForm c={c} summary={summary} />

              {accounts?.ok && accounts.result.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    {c.selectAccountTitle}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {accounts.result.map((item) => (
                      <form key={item.id} action={selectAdAccount}>
                        <input type="hidden" name="adAccountId" value={item.id} />
                        <button type="submit" className="btn-secondary text-xs">
                          {item.name} · {item.currency}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {connected && targets.length === 0 && (
            <section className="card overflow-hidden">
              <div className="px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">{c.targetsTitle}</h2>
              </div>
              <p className="border-t border-slate-100 px-4 py-8 text-center text-xs text-slate-500">
                {c.targetsEmpty}
              </p>
            </section>
          )}

          {connected && targets.length > 0 && (
            <TargetsPanel
              targets={targets}
              copy={c}
              currency={currency}
              factor={targetFactor}
              objectiveLabel={c[OBJECTIVE_KEY[targets[0].objective] ?? "objTraffic"]}
              returnTo={selfQuery}
            />
          )}

          {connected && (
            <section className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{c.chartTitle}</h2>
                <span className="text-[11px] text-slate-500">{c.statsTitle}</span>
              </div>
              <AdsChart
                rows={dailyRows}
                currency={currency}
                labels={{ spend: c.chartSpend, clicks: c.chartClicks, empty: c.chartEmpty }}
              />
            </section>
          )}

          {connected && (
            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  {c.campaignsTitle}
                  {rows.length > 0 && (
                    <span className="ml-1.5 text-[11px] font-medium text-slate-500">
                      {c.totalCampaigns}: {rows.length}
                    </span>
                  )}
                </h2>
              </div>

              {rows.length === 0 ? (
                <p className="border-t border-slate-100 px-4 py-8 text-center text-xs text-slate-500">
                  {c.campaignsEmpty}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {rows.map((row) => {
                    const active = row.effectiveStatus === "ACTIVE";

                    return (
                      <li key={row.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{row.name}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {c[OBJECTIVE_KEY[row.objective] ?? "objTraffic"]}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <form action={toggleAdStatus}>
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="status" value={active ? "PAUSED" : "ACTIVE"} />
                              <input type="hidden" name="returnTo" value={selfQuery} />
                              <input type="hidden" name="campaignId" value={row.id} />
                              <button
                                type="submit"
                                className={
                                  active
                                    ? "rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700"
                                    : "rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700"
                                }
                              >
                                {active ? c.pause : c.resume}
                              </button>
                            </form>

                            <Link
                              href={`/admin/reklama/kampaniya/${row.id}?d=${datePreset}`}
                              className="text-[11px] font-semibold text-brand-700 hover:underline"
                            >
                              {c.openCampaign}
                            </Link>
                          </div>
                        </div>

                        <dl className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                          {[
                            {
                              label: c.thBudgetCol,
                              value:
                                row.dailyBudget !== null
                                  ? `${num(row.dailyBudget / minorUnitFactor(currency), 2)} ${currency}`
                                  : c.noData,
                            },
                            { label: c.thSpend, value: `${num(row.insights.spend, 2)} ${currency}` },
                            { label: c.thClicks, value: num(row.insights.clicks) },
                            { label: c.thCtr, value: `${num(row.insights.ctr, 2)}%` },
                            { label: c.thCpc, value: `${num(row.insights.cpc, 2)} ${currency}` },
                          ].map((item) => (
                            <div key={item.label} className="rounded-lg bg-slate-50 px-2 py-1.5">
                              <dt className="text-[9px] font-semibold tracking-wide text-slate-500 uppercase">
                                {item.label}
                              </dt>
                              <dd className="text-xs font-semibold text-slate-800">{item.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {connected && (
            <section className="card p-5">
              <h2 className="text-sm font-semibold text-slate-900">{c.formTitle}</h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{c.formHint}</p>

              {metaSettings.pageId ? (
                <MetaAdBuilder listings={adListings} copy={c} currency={currency} />
              ) : (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {c.notConnected}
                </p>
              )}
            </section>
          )}

          {connected && audienceRows.length > 0 && (
            <section className="card overflow-hidden">
              <div className="px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">{c.audiencesTitle}</h2>
                <p className="mt-1 text-xs text-slate-500">{c.audiencesHint}</p>
              </div>

              <div className="overflow-x-auto border-t border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">{c.thAudience}</th>
                      <th className="px-4 py-2.5 font-medium">{c.thAudienceType}</th>
                      <th className="px-4 py-2.5 font-medium">{c.thAudienceSize}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {audienceRows.slice(0, 15).map((audience) => (
                      <tr key={audience.id}>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{audience.name}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{audience.subtype}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">
                          {num(audience.sizeLower)} – {num(audience.sizeUpper)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {connected && (
            <CollapsibleSection title={c.settingsTitle} hideLabel={c.hideBtn} showLabel={c.showBtn}>
              <section className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">{c.selectAccountTitle}</h2>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {c.connected}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{c.selectAccountHint}</p>

                {accounts?.ok && accounts.result.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {accounts.result.map((item) => (
                      <form key={item.id} action={selectAdAccount}>
                        <input type="hidden" name="adAccountId" value={item.id} />
                        <button
                          type="submit"
                          className={
                            summary.adAccountId === item.id
                              ? "rounded-lg border border-brand-700 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800"
                              : "rounded-lg border border-slate-200 bg-card px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          }
                        >
                          {item.name} · {item.currency}
                        </button>
                      </form>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    {c.accountsEmpty}
                  </p>
                )}

                {account?.ok && (
                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
                    {[
                      { label: c.account, value: account.result.name },
                      { label: c.currency, value: account.result.currency },
                      { label: c.accountStatus, value: account.result.status },
                      { label: c.timezone, value: account.result.timezone ?? "—" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <dt className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                          {item.label}
                        </dt>
                        <dd className="mt-0.5 truncate text-sm text-slate-800">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {account && !account.ok && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {account.description}
                  </p>
                )}

                <CredentialsForm c={c} summary={summary} />

                <div className="mt-2 flex flex-wrap gap-2">
                  <a href="/api/meta/oauth/start?mode=ads" className="btn-secondary text-xs">
                    <MetaLogo className="size-3.5" />
                    {c.connectWithMeta}
                  </a>
                </div>

                <ManualSteps c={c} />
              </section>
            </CollapsibleSection>
          )}

          <p className="text-[11px] leading-5 text-slate-500">{c.note}</p>
        </>
      )}
    </div>
  );
}
