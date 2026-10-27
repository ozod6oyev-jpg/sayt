import { randomUUID } from "crypto";
import { decryptSecret, encryptSecret } from "./crypto";
import { prisma } from "./prisma";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type AdsResult<T> =
  | { ok: true; result: T }
  | { ok: false; description: string; code?: number };

export type AdsSettings = {
  adAccountId: string | null;
  hasToken: boolean;
};

export type AdAccountInfo = {
  name: string;
  currency: string;
  status: string;
  timezone: string | null;
};

export type AdObjective = "OUTCOME_TRAFFIC" | "OUTCOME_AWARENESS" | "OUTCOME_ENGAGEMENT";

/**
 * Ba'zi valyutalarda meta.minimal birlik = 1 (butun so'm/yen), qolganlarida 1/100.
 * daily_budget Marketing API'da shu minimal birlikda yuboriladi.
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "UZS",
  "JPY",
  "KRW",
  "VND",
  "CLP",
  "ISK",
  "UGX",
  "RWF",
  "XAF",
  "XOF",
  "XPF",
  "GNF",
  "KMF",
  "DJF",
  "BIF",
  "MGA",
  "PYG",
  "VUV",
]);

export function minorUnitFactor(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 1 : 100;
}

export type CreateAdInput = {
  name: string;
  objective: AdObjective;
  /** Foydalanuvchi kiritgan summa (butun birlikda, masalan 10 USD yoki 50000 UZS) */
  budgetAmount: number;
  currency: string;
  days: number;
  ageMin: number;
  ageMax: number;
  gender: "all" | "male" | "female";
  pageId: string;
  link: string;
  message: string;
  headline: string;
  /** Reels videolari — ommaviy URL va 9:16 muqova (aynan 3 ta) */
  videos: { url: string; thumbnail: string }[];
  cta: string;
  active: boolean;
};

export type CreatedAd = {
  campaignId: string;
  adSetId: string;
  adId: string;
  adIds: string[];
};

/** Ad account ID ni "act_123" ko'rinishidan tozalaydi */
export function normalizeAdAccountId(value: string): string {
  return value.trim().replace(/^act_/i, "").replace(/\D/g, "");
}

export async function getAdsSettings(): Promise<{ adAccountId: string | null; token: string | null }> {
  const row = await prisma.metaIntegration.findUnique({ where: { id: "default" } });
  return {
    adAccountId: row?.adAccountId ?? null,
    token: decryptSecret(row?.adsToken),
  };
}

export async function getAdsSummary(): Promise<AdsSettings> {
  const { adAccountId, token } = await getAdsSettings();
  return { adAccountId, hasToken: Boolean(token) };
}

/** Bo'sh token eski qiymatni saqlab qoladi */
export async function saveAdsSettings(input: {
  adAccountId: string;
  adsToken: string;
}): Promise<void> {
  await prisma.metaIntegration.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      verifyToken: randomUUID().replace(/-/g, ""),
      adAccountId: input.adAccountId || null,
      adsToken: input.adsToken ? encryptSecret(input.adsToken) : null,
    },
    update: {
      adAccountId: input.adAccountId || null,
      ...(input.adsToken ? { adsToken: encryptSecret(input.adsToken) } : {}),
    },
  });
}

/** Marketing API chaqiruvi — token faqat sarlavhada ketadi */
async function adsCall<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: Record<string, unknown> } = {},
): Promise<AdsResult<T>> {
  const { token } = await getAdsSettings();
  if (!token) return { ok: false, description: "Ads access token kiritilmagan" };

  try {
    const response = await fetch(`${GRAPH_BASE}/${path.replace(/^\//, "")}`, {
      method: options.method ?? "GET",
      headers: {
        authorization: `Bearer ${token}`,
        ...(options.method === "POST" ? { "content-type": "application/json" } : {}),
      },
      body: options.method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    const payload = (await response.json().catch(() => null)) as
      | (T & { error?: { message?: string; code?: number; error_user_msg?: string } })
      | null;

    if (!response.ok || !payload || payload.error) {
      return {
        ok: false,
        description:
          payload?.error?.error_user_msg ??
          payload?.error?.message ??
          `Marketing API xatosi (${response.status})`,
        code: payload?.error?.code,
      };
    }

    return { ok: true, result: payload as T };
  } catch {
    return { ok: false, description: "Meta bilan aloqa yo'q" };
  }
}

const STATUS_LABELS: Record<number, string> = {
  1: "Faol",
  2: "O'chirilgan",
  3: "Ruxsat kutilmoqda",
  7: "Ko'rib chiqilmoqda",
  9: "To'lov davri",
  100: "Yopilgan",
  101: "Yopilgan",
  201: "To'lov kutilmoqda",
  202: "Bloklangan",
  203: "Muddati tugagan",
};

type RawAdAccount = {
  id: string;
  name?: string;
  currency?: string;
  account_status?: number;
  timezone_name?: string;
};

/** Ad account ma'lumotini oladi (valyuta, holat) */
export async function checkAdAccount(): Promise<AdsResult<AdAccountInfo>> {
  const { adAccountId } = await getAdsSettings();
  if (!adAccountId) return { ok: false, description: "Ad account ID kiritilmagan" };

  const result = await adsCall<RawAdAccount>(`act_${adAccountId}`, {
    method: "GET",
  });

  if (!result.ok) return result;

  return {
    ok: true,
    result: {
      name: result.result.name ?? `act_${adAccountId}`,
      currency: result.result.currency ?? "USD",
      status: STATUS_LABELS[result.result.account_status ?? 1] ?? "Noma'lum",
      timezone: result.result.timezone_name ?? null,
    },
  };
}

const OBJECTIVE_PLAN: Record<AdObjective, { goal: string; destination?: string }> = {
  OUTCOME_TRAFFIC: { goal: "LINK_CLICKS", destination: "WEBSITE" },
  OUTCOME_AWARENESS: { goal: "REACH" },
  OUTCOME_ENGAGEMENT: { goal: "POST_ENGAGEMENT", destination: "ON_POST" },
};

const GRAPH_VIDEO = `https://graph-video.facebook.com/${GRAPH_VERSION}`;

/** Videoni Meta'ga yuklaydi — Meta faylni bizning ommaviy URL'dan o'zi oladi */
async function uploadAdVideo(account: string, url: string): Promise<AdsResult<{ id: string }>> {
  const { token } = await getAdsSettings();
  if (!token) return { ok: false, description: "Ads access token kiritilmagan" };

  const body = new URLSearchParams();
  body.set("file_url", url);

  try {
    const response = await fetch(`${GRAPH_VIDEO}/${account}/advideos`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });

    const payload = (await response.json().catch(() => null)) as
      | { id?: string; error?: { message?: string; code?: number } }
      | null;

    if (!response.ok || !payload?.id) {
      return {
        ok: false,
        description: payload?.error?.message ?? "Videoni yuklab bo'lmadi",
        code: payload?.error?.code,
      };
    }

    return { ok: true, result: { id: payload.id } };
  } catch {
    return { ok: false, description: "Video yuklashda aloqa uzildi" };
  }
}

/** Meta videolarni qayta ishlab bo'lishini kutadi (aks holda kreativ yaratilmaydi) */
async function waitForVideos(videoIds: string[]): Promise<AdsResult<null>> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const states = await Promise.all(
      videoIds.map((id) => adsCall<{ status?: { video_status?: string } }>(`${id}?fields=status`)),
    );

    if (states.some((state) => state.ok && state.result.status?.video_status === "error")) {
      return { ok: false, description: "Videoni Meta qayta ishlay olmadi (format yoki hajm)" };
    }

    const ready = states.every((state) => state.ok && state.result.status?.video_status === "ready");
    if (ready) return { ok: true, result: null };

    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  return {
    ok: false,
    description: "Video qayta ishlanishi cho'zildi — 1-2 daqiqadan so'ng qayta urinib ko'ring",
  };
}

/**
 * Reels kampaniyasi: videolar → kampaniya → ad set (faqat IG/FB Reels) →
 * har bir video uchun alohida e'lon.
 */
export async function createMetaAd(input: CreateAdInput): Promise<AdsResult<CreatedAd>> {
  const { adAccountId } = await getAdsSettings();
  if (!adAccountId) return { ok: false, description: "Ad account ID kiritilmagan" };
  if (!input.pageId) return { ok: false, description: "Page ID topilmadi — Meta'ni ulang" };
  if (input.videos.length !== 3) {
    return { ok: false, description: "Bitta targetga aynan 3 ta video ulanadi" };
  }

  const status = input.active ? "ACTIVE" : "PAUSED";
  const plan = OBJECTIVE_PLAN[input.objective];
  const account = `act_${adAccountId}`;
  const dailyBudget = Math.round(input.budgetAmount * minorUnitFactor(input.currency));

  // 1) Videolar avval yuklanadi — kampaniya yaratilib, keyin xato bo'lmasin
  const uploads = await Promise.all(
    input.videos.map((clip) => uploadAdVideo(account, clip.url)),
  );
  const failedUpload = uploads.find((upload) => !upload.ok);
  if (failedUpload && !failedUpload.ok) {
    return { ok: false, description: `Video: ${failedUpload.description}`, code: failedUpload.code };
  }

  const videoIds = uploads.flatMap((upload) => (upload.ok ? [upload.result.id] : []));

  const ready = await waitForVideos(videoIds);
  if (!ready.ok) return ready;

  // 2) Kampaniya
  const campaign = await adsCall<{ id: string }>(`${account}/campaigns`, {
    method: "POST",
    body: {
      name: input.name,
      objective: input.objective,
      status,
      buying_type: "AUCTION",
      special_ad_categories: [],
      // Byudjet ad set darajasida — kampaniya darajasidagi taqsimot o'chiriladi
      is_adset_budget_sharing_enabled: false,
    },
  });

  if (!campaign.ok) {
    return { ok: false, description: `Kampaniya: ${campaign.description}`, code: campaign.code };
  }

  const genders = input.gender === "male" ? [1] : input.gender === "female" ? [2] : [];

  // 3) Ad set — faqat Reels (Instagram + Facebook)
  const adSet = await adsCall<{ id: string }>(`${account}/adsets`, {
    method: "POST",
    body: {
      name: `${input.name} · Reels`,
      campaign_id: campaign.result.id,
      daily_budget: String(dailyBudget),
      billing_event: "IMPRESSIONS",
      optimization_goal: plan.goal,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      status,
      ...(plan.destination ? { destination_type: plan.destination } : {}),
      end_time: new Date(Date.now() + input.days * 24 * 60 * 60 * 1000).toISOString(),
      targeting: {
        geo_locations: { countries: ["UZ"] },
        age_min: input.ageMin,
        age_max: input.ageMax,
        ...(genders.length > 0 ? { genders } : {}),
        publisher_platforms: ["instagram", "facebook"],
        instagram_positions: ["reels"],
        facebook_positions: ["facebook_reels"],
        targeting_automation: { advantage_audience: 0 },
      },
    },
  });

  if (!adSet.ok) {
    return { ok: false, description: `Auditoriya: ${adSet.description}`, code: adSet.code };
  }

  // 4) Har bir video — alohida e'lon
  const adIds: string[] = [];

  for (const [index, videoId] of videoIds.entries()) {
    const creative = await adsCall<{ id: string }>(`${account}/adcreatives`, {
      method: "POST",
      body: {
        name: `${input.name} · video ${index + 1}`,
        object_story_spec: {
          page_id: input.pageId,
          video_data: {
            video_id: videoId,
            image_url: input.videos[index].thumbnail,
            message: input.message,
            title: input.headline,
            call_to_action: { type: input.cta, value: { link: input.link } },
          },
        },
      },
    });

    if (!creative.ok) {
      return {
        ok: false,
        description: `Kreativ ${index + 1}: ${creative.description}`,
        code: creative.code,
      };
    }

    const ad = await adsCall<{ id: string }>(`${account}/ads`, {
      method: "POST",
      body: {
        name: `${input.name} · Reels ${index + 1}`,
        adset_id: adSet.result.id,
        creative: { creative_id: creative.result.id },
        status,
      },
    });

    if (!ad.ok) {
      return { ok: false, description: `E'lon ${index + 1}: ${ad.description}`, code: ad.code };
    }

    adIds.push(ad.result.id);
  }

  return {
    ok: true,
    result: {
      campaignId: campaign.result.id,
      adSetId: adSet.result.id,
      adId: adIds[0],
      adIds,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Boshqaruv: akkauntlar, kampaniyalar, ad setlar, e'lonlar, insights */
/* ------------------------------------------------------------------ */

export type AdAccountOption = {
  id: string;
  name: string;
  currency: string;
  status: string;
};

type RawAccount = { id: string; name?: string; currency?: string; account_status?: number };

/** Token egalik qiladigan barcha ad accountlar */
export async function listAdAccounts(): Promise<AdsResult<AdAccountOption[]>> {
  const result = await adsCall<{ data: RawAccount[] }>(
    "me/adaccounts?fields=id,name,currency,account_status&limit=100",
  );

  if (!result.ok) return result;

  return {
    ok: true,
    result: (result.result.data ?? []).map((item) => ({
      id: normalizeAdAccountId(item.id),
      name: item.name ?? item.id,
      currency: item.currency ?? "USD",
      status: STATUS_LABELS[item.account_status ?? 1] ?? "Noma'lum",
    })),
  };
}

export type InsightRow = {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reach: number;
};

type RawInsight = {
  campaign_id?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
};

const INSIGHT_FIELDS = "campaign_id,spend,impressions,clicks,ctr,cpc,cpm,reach";

function toInsight(row: RawInsight | undefined): InsightRow {
  return {
    spend: Number(row?.spend ?? 0),
    impressions: Number(row?.impressions ?? 0),
    clicks: Number(row?.clicks ?? 0),
    ctr: Number(row?.ctr ?? 0),
    cpc: Number(row?.cpc ?? 0),
    cpm: Number(row?.cpm ?? 0),
    reach: Number(row?.reach ?? 0),
  };
}

export type CampaignRow = {
  id: string;
  name: string;
  status: string;
  effectiveStatus: string;
  objective: string;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  insights: InsightRow;
};

type RawCampaign = {
  id: string;
  name?: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
};

/** Kampaniyalar + davr bo'yicha statistika */
export async function listCampaigns(
  adAccountId: string,
  datePreset: string,
): Promise<AdsResult<CampaignRow[]>> {
  const [campaigns, insights] = await Promise.all([
    adsCall<{ data: RawCampaign[] }>(
      `act_${adAccountId}/campaigns?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget&limit=200`,
    ),
    adsCall<{ data: RawInsight[] }>(
      `act_${adAccountId}/insights?level=campaign&date_preset=${datePreset}&fields=${INSIGHT_FIELDS}&limit=500`,
    ),
  ]);

  if (!campaigns.ok) return campaigns;

  const byCampaign = new Map<string, RawInsight>();
  if (insights.ok) {
    for (const row of insights.result.data ?? []) {
      if (row.campaign_id) byCampaign.set(row.campaign_id, row);
    }
  }

  return {
    ok: true,
    result: (campaigns.result.data ?? []).map((campaign) => ({
      id: campaign.id,
      name: campaign.name ?? campaign.id,
      status: campaign.status ?? "PAUSED",
      effectiveStatus: campaign.effective_status ?? campaign.status ?? "PAUSED",
      objective: campaign.objective ?? "",
      dailyBudget: campaign.daily_budget ? Number(campaign.daily_budget) : null,
      lifetimeBudget: campaign.lifetime_budget ? Number(campaign.lifetime_budget) : null,
      insights: toInsight(byCampaign.get(campaign.id)),
    })),
  };
}

export type CampaignDetail = {
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  insights: InsightRow;
};

export type AdSetRow = {
  id: string;
  name: string;
  status: string;
  effectiveStatus: string;
  dailyBudget: number | null;
  optimizationGoal: string;
};

export type AdRow = {
  id: string;
  name: string;
  adSetId: string;
  status: string;
  effectiveStatus: string;
};

export type CampaignBundle = {
  campaign: CampaignDetail;
  adSets: AdSetRow[];
  ads: AdRow[];
};

/** Bitta kampaniya: sozlamalar, ad setlar va e'lonlar */
export async function loadCampaign(
  campaignId: string,
  datePreset: string,
): Promise<AdsResult<CampaignBundle>> {
  const [campaign, insights, adSets, ads] = await Promise.all([
    adsCall<RawCampaign>(
      `${campaignId}?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget`,
    ),
    adsCall<{ data: RawInsight[] }>(
      `${campaignId}/insights?date_preset=${datePreset}&fields=${INSIGHT_FIELDS.replace("campaign_id,", "")}`,
    ),
    adsCall<{ data: { id: string; name?: string; status?: string; effective_status?: string; daily_budget?: string; optimization_goal?: string }[] }>(
      `${campaignId}/adsets?fields=id,name,status,effective_status,daily_budget,optimization_goal&limit=100`,
    ),
    adsCall<{ data: { id: string; name?: string; status?: string; effective_status?: string; adset_id?: string }[] }>(
      `${campaignId}/ads?fields=id,name,status,effective_status,adset_id&limit=200`,
    ),
  ]);

  if (!campaign.ok) return campaign;

  return {
    ok: true,
    result: {
      campaign: {
        id: campaign.result.id,
        name: campaign.result.name ?? campaign.result.id,
        status: campaign.result.status ?? "PAUSED",
        objective: campaign.result.objective ?? "",
        dailyBudget: campaign.result.daily_budget ? Number(campaign.result.daily_budget) : null,
        lifetimeBudget: campaign.result.lifetime_budget
          ? Number(campaign.result.lifetime_budget)
          : null,
        insights: toInsight(insights.ok ? insights.result.data?.[0] : undefined),
      },
      adSets: (adSets.ok ? (adSets.result.data ?? []) : []).map((adSet) => ({
        id: adSet.id,
        name: adSet.name ?? adSet.id,
        status: adSet.status ?? "PAUSED",
        effectiveStatus: adSet.effective_status ?? adSet.status ?? "PAUSED",
        dailyBudget: adSet.daily_budget ? Number(adSet.daily_budget) : null,
        optimizationGoal: adSet.optimization_goal ?? "",
      })),
      ads: (ads.ok ? (ads.result.data ?? []) : []).map((ad) => ({
        id: ad.id,
        name: ad.name ?? ad.id,
        adSetId: ad.adset_id ?? "",
        status: ad.status ?? "PAUSED",
        effectiveStatus: ad.effective_status ?? ad.status ?? "PAUSED",
      })),
    },
  };
}

export type AudienceRow = {
  id: string;
  name: string;
  subtype: string;
  sizeLower: number;
  sizeUpper: number;
};

/** Saqlangan auditoriyalar (custom audiences) */
export async function listAudiences(adAccountId: string): Promise<AdsResult<AudienceRow[]>> {
  const result = await adsCall<{
    data: {
      id: string;
      name?: string;
      subtype?: string;
      approximate_count_lower_bound?: number;
      approximate_count_upper_bound?: number;
    }[];
  }>(
    `act_${adAccountId}/customaudiences?fields=id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound&limit=100`,
  );

  if (!result.ok) return result;

  return {
    ok: true,
    result: (result.result.data ?? []).map((item) => ({
      id: item.id,
      name: item.name ?? item.id,
      subtype: item.subtype ?? "CUSTOM",
      sizeLower: item.approximate_count_lower_bound ?? 0,
      sizeUpper: item.approximate_count_upper_bound ?? 0,
    })),
  };
}

/** Kampaniya, ad set yoki e'lon holatini o'zgartirish */
export async function setObjectStatus(
  objectId: string,
  status: "ACTIVE" | "PAUSED",
): Promise<AdsResult<{ id: string; status: string }>> {
  return adsCall<{ id: string; status: string }>(objectId, {
    method: "POST",
    body: { status },
  });
}

export type DailyInsightRow = {
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
};

/** Kunlik sarf va bosishlar — grafik uchun */
export async function getDailyInsights(
  adAccountId: string,
  datePreset: string,
): Promise<AdsResult<DailyInsightRow[]>> {
  type RawDaily = { date_start?: string; spend?: string; clicks?: string; impressions?: string };

  const result = await adsCall<{ data: RawDaily[] }>(
    `act_${adAccountId}/insights?level=account&date_preset=${datePreset}&time_increment=1&fields=spend,clicks,impressions&limit=90`,
  );

  if (!result.ok) return result;

  return {
    ok: true,
    result: (result.result.data ?? [])
      .filter((row) => row.date_start)
      .map((row) => ({
        date: row.date_start as string,
        spend: Number(row.spend ?? 0),
        clicks: Number(row.clicks ?? 0),
        impressions: Number(row.impressions ?? 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/** Ad setning kunlik byudjetini yangilash (minimal birlikda) */
export async function setAdSetBudget(
  adSetId: string,
  minorUnits: number,
): Promise<AdsResult<{ id: string }>> {
  return adsCall<{ id: string }>(adSetId, {
    method: "POST",
    body: { daily_budget: String(Math.round(minorUnits)) },
  });
}
