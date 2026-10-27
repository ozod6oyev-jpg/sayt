import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMetaSettings, metaBaseUrl, metaOAuthUrls } from "@/lib/meta";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const THREADS_TOKEN_URL = "https://graph.threads.net/oauth/access_token";
const THREADS_GRAPH = "https://graph.threads.net";

type TokenResponse = {
  access_token?: string;
  user_id?: string;
  error_message?: string;
  error?: { message?: string };
};

type Profile = { id?: string; username?: string; error?: { message?: string } };

function failure(request: Request, code: string) {
  return NextResponse.redirect(new URL(`/admin/meta/kanallar?threads=${code}`, metaBaseUrl()));
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/kirish", metaBaseUrl()));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = (await cookies()).get("threads_oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return failure(request, "oauth_state");
  }

  const settings = await getMetaSettings();
  if (!settings.appId || !settings.appSecret) {
    return failure(request, "error");
  }

  const body = new URLSearchParams({
    client_id: settings.appId,
    client_secret: settings.appSecret,
    grant_type: "authorization_code",
    redirect_uri: metaOAuthUrls().threads,
    code,
  });

  const tokenResponse = await fetch(THREADS_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  const token = (await tokenResponse?.json().catch(() => null)) as TokenResponse | null;
  if (!token?.access_token) {
    return failure(request, "error");
  }

  // Uzoq muddatli Threads tokeni (~60 kun)
  const longUrl = new URL(`${THREADS_GRAPH}/access_token`);
  longUrl.searchParams.set("grant_type", "th_exchange_token");
  longUrl.searchParams.set("client_secret", settings.appSecret);
  longUrl.searchParams.set("access_token", token.access_token);

  const longResponse = await fetch(longUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  const longToken = (await longResponse?.json().catch(() => null)) as TokenResponse | null;

  const accessToken = longToken?.access_token ?? token.access_token;

  const profileUrl = new URL(`${THREADS_GRAPH}/v1.0/me`);
  profileUrl.searchParams.set("fields", "id,username");

  const profileResponse = await fetch(profileUrl, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  const profile = (await profileResponse?.json().catch(() => null)) as Profile | null;

  const threadsUserId = profile?.id ?? token.user_id;
  if (!threadsUserId) {
    return failure(request, "error");
  }

  await prisma.metaIntegration.update({
    where: { id: "default" },
    data: {
      threadsUserId,
      threadsToken: encryptSecret(accessToken),
      threadsUsername: profile?.username ? `@${profile.username}` : null,
    },
  });

  const response = NextResponse.redirect(new URL("/admin/meta/kanallar?threads=ok", metaBaseUrl()));
  response.cookies.delete("threads_oauth_state");
  return response;
}
