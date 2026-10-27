import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleAdStatus, updateAdSetBudget } from "@/app/actions/ads";
import { adsCopy, type AdsCopy } from "@/lib/admin-copy/ads";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";
import { checkAdAccount, getAdsSummary, loadCampaign, minorUnitFactor } from "@/lib/meta-ads";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

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

export default async function CampaignPage({ params, searchParams }: PageProps) {
  await requireOwner();

  const c = await getAdminCopy(adsCopy);
  const { id } = await params;
  const raw = await searchParams;
  const datePreset = first(raw.d) ?? "last_7d";

  const [summary, account, bundle] = await Promise.all([
    getAdsSummary(),
    checkAdAccount(),
    loadCampaign(id, datePreset),
  ]);

  if (!bundle.ok) {
    notFound();
  }

  const currency = account.ok ? account.result.currency : "USD";
  const campaign = bundle.result.campaign;
  const active = campaign.status === "ACTIVE";
  const self = `/admin/reklama/kampaniya/${id}?d=${datePreset}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={`/admin/reklama?d=${datePreset}`}
            className="text-[11px] font-semibold text-brand-700 hover:underline"
          >
            ← {c.backToAds}
          </Link>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{campaign.name}</h2>
          <p className="text-xs text-slate-500">
            {c.campaignObjective}: {c[OBJECTIVE_KEY[campaign.objective] ?? "objTraffic"]}
            {campaign.dailyBudget !== null
              ? ` · ${c.campaignBudget}: ${num(campaign.dailyBudget / minorUnitFactor(currency), 2)} ${currency}`
              : ""}
          </p>
        </div>

      </div>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{c.campaignStatusLabel}</h3>
          <form action={toggleAdStatus}>
            <input type="hidden" name="id" value={campaign.id} />
            <input type="hidden" name="status" value={active ? "PAUSED" : "ACTIVE"} />
            <input type="hidden" name="returnTo" value={self} />
            <input type="hidden" name="campaignId" value={campaign.id} />
            <button
              type="submit"
              className={
                active
                  ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
              }
            >
              {active ? c.pause : c.resume}
            </button>
          </form>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: c.kpiSpend, value: `${num(campaign.insights.spend, 2)} ${currency}` },
            { label: c.kpiImpressions, value: num(campaign.insights.impressions) },
            { label: c.kpiClicks, value: num(campaign.insights.clicks) },
            { label: c.kpiCtr, value: `${num(campaign.insights.ctr, 2)}%` },
            { label: c.kpiCpc, value: `${num(campaign.insights.cpc, 2)} ${currency}` },
            { label: c.kpiCpm, value: `${num(campaign.insights.cpm, 2)} ${currency}` },
            { label: c.kpiReach, value: num(campaign.insights.reach) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-semibold text-slate-900">{c.adSetsTitle}</h3>

        {bundle.result.adSets.length === 0 ? (
          <p className="border-t border-slate-100 px-4 py-6 text-center text-xs text-slate-500">
            {c.adSetsEmpty}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {bundle.result.adSets.map((adSet) => {
              const adSetActive = adSet.status === "ACTIVE";
              const ads = bundle.result.ads.filter((ad) => ad.adSetId === adSet.id);

              return (
                <div key={adSet.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{adSet.name}</p>
                      <p className="text-[11px] text-slate-500">{adSet.optimizationGoal || "—"}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateAdSetBudget} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={adSet.id} />
                        <input type="hidden" name="currency" value={currency} />
                        <input type="hidden" name="returnTo" value={self} />
                        <input
                          name="budget"
                          type="number"
                          min={1}
                          step="0.01"
                          defaultValue={
                            adSet.dailyBudget !== null
                              ? adSet.dailyBudget / minorUnitFactor(currency)
                              : 10
                          }
                          className="field h-8 w-24 py-1 text-xs"
                        />
                        <button type="submit" className="btn-secondary h-8 px-2 text-[11px]">
                          {c.saveBudget}
                        </button>
                      </form>

                      <form action={toggleAdStatus}>
                        <input type="hidden" name="id" value={adSet.id} />
                        <input type="hidden" name="status" value={adSetActive ? "PAUSED" : "ACTIVE"} />
                        <input type="hidden" name="returnTo" value={self} />
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <button
                          type="submit"
                          className={
                            adSetActive
                              ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                              : "rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                          }
                        >
                          {adSetActive ? c.pause : c.resume}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                      {c.adsTitle}
                    </p>

                    {ads.length === 0 ? (
                      <p className="mt-1 text-[11px] text-slate-500">{c.adsEmpty}</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {ads.map((ad) => {
                          const adActive = ad.status === "ACTIVE";
                          return (
                            <li key={ad.id} className="flex flex-wrap items-center gap-2">
                              <span className="min-w-0 flex-1 truncate text-xs text-slate-700">
                                {ad.name}
                              </span>
                              <form action={toggleAdStatus}>
                                <input type="hidden" name="id" value={ad.id} />
                                <input type="hidden" name="status" value={adActive ? "PAUSED" : "ACTIVE"} />
                                <input type="hidden" name="returnTo" value={self} />
                                <input type="hidden" name="campaignId" value={campaign.id} />
                                <button
                                  type="submit"
                                  className={
                                    adActive
                                      ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                      : "rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                                  }
                                >
                                  {adActive ? c.pause : c.resume}
                                </button>
                              </form>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
