import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMetaSettings, metaBaseUrl, metaOAuthUrls, saveMetaSettings } from "@/lib/meta";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v21.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

type TokenResponse = { access_token?: string; expires_in?: number; error?: { message?: string } };

type PageAccount = {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: { id: string; username?: string };
};

type AccountsResponse = { data?: PageAccount[]; error?: { message?: string } };

async function getJson<T>(url: URL): Promise<T | null> {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  return (await response.json().catch(() => null)) as T | null;
}

function failure(request: Request, code: string) {
  return NextResponse.redirect(new URL(`/admin/meta/kanallar?meta=${code}`, metaBaseUrl()));
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    return NextResponse.redirect(new URL("/kirish", metaBaseUrl()));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = (await cookies()).get("meta_oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return failure(request, "oauth_state");
  }

  const settings = await getMetaSettings();
  if (!settings.appId || !settings.appSecret) {
    return failure(request, "missing");
  }

  const redirectUri = metaOAuthUrls().facebook;

  const shortTokenUrl = new URL(`${GRAPH}/oauth/access_token`);
  shortTokenUrl.searchParams.set("client_id", settings.appId);
  shortTokenUrl.searchParams.set("client_secret", settings.appSecret);
  shortTokenUrl.searchParams.set("redirect_uri", redirectUri);
  shortTokenUrl.searchParams.set("code", code);

  const shortToken = await getJson<TokenResponse>(shortTokenUrl);
  if (!shortToken?.access_token) {
    return failure(request, "oauth_error");
  }

  // Uzoq muddatli foydalanuvchi tokeni (60 kun)
  const longTokenUrl = new URL(`${GRAPH}/oauth/access_token`);
  longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
  longTokenUrl.searchParams.set("client_id", settings.appId);
  longTokenUrl.searchParams.set("client_secret", settings.appSecret);
  longTokenUrl.searchParams.set("fb_exchange_token", shortToken.access_token);

  const longToken = await getJson<TokenResponse>(longTokenUrl);
  const userToken = longToken?.access_token ?? shortToken.access_token;

  const accountsUrl = new URL(`${GRAPH}/me/accounts`);
  accountsUrl.searchParams.set(
    "fields",
    "id,name,access_token,instagram_business_account{id,username}",
  );

  const accountsResponse = await fetch(accountsUrl, {
    headers: { authorization: `Bearer ${userToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const accounts = (await accountsResponse.json().catch(() => null)) as AccountsResponse | null;

  const pages = accounts?.data ?? [];
  // Bir Business portfolio'da bir nechta sahifa bo'lishi mumkin: paneldagi
  // Page ID kiritilgan bo'lsa o'sha sahifa tanlanadi, aks holda Instagram
  // bog'langan birinchi sahifa olinadi.
  const page =
    pages.find((item) => settings.pageId && item.id === settings.pageId) ??
    pages.find((item) => item.instagram_business_account) ??
    pages[0];

  if (!page?.access_token) {
    return failure(request, "oauth_pages");
  }

  await saveMetaSettings({
    pageId: page.id,
    pageToken: page.access_token,
    igUserId: page.instagram_business_account?.id ?? "",
  });

  await prisma.metaIntegration.update({
    where: { id: "default" },
    data: {
      pageName: page.name,
      igUsername: page.instagram_business_account?.username
        ? `@${page.instagram_business_account.username}`
        : null,
      connectedAt: new Date(),
    },
  });

  const response = NextResponse.redirect(new URL("/admin/meta/kanallar?meta=ok", metaBaseUrl()));
  response.cookies.delete("meta_oauth_state");
  return response;
}
