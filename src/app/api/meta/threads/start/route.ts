import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMetaSettings, metaBaseUrl, metaOAuthUrls } from "@/lib/meta";

export const dynamic = "force-dynamic";

const SCOPES = ["threads_basic", "threads_content_publish"];

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    return NextResponse.redirect(new URL("/kirish", metaBaseUrl()));
  }

  const settings = await getMetaSettings();
  if (!settings.appId || !settings.appSecret) {
    return NextResponse.redirect(new URL("/admin/meta/kanallar?meta=missing", metaBaseUrl()));
  }

  const state = randomBytes(16).toString("hex");
  const dialog = new URL("https://threads.net/oauth/authorize");
  dialog.searchParams.set("client_id", settings.appId);
  dialog.searchParams.set("redirect_uri", metaOAuthUrls().threads);
  dialog.searchParams.set("scope", SCOPES.join(","));
  dialog.searchParams.set("response_type", "code");
  dialog.searchParams.set("state", state);

  const response = NextResponse.redirect(dialog);
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const secure = proto ? proto === "https" : new URL(request.url).protocol === "https:";

  response.cookies.set("threads_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 600,
  });

  return response;
}
