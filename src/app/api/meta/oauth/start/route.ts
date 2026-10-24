import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMetaSettings, metaBaseUrl, metaOAuthUrls } from "@/lib/meta";

export const dynamic = "force-dynamic";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v21.0";

const SCOPES = [
  "pages_show_list",
  "pages_messaging",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_messages",
  "business_management",
];

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
  const dialog = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  dialog.searchParams.set("client_id", settings.appId);
  dialog.searchParams.set("redirect_uri", metaOAuthUrls().facebook);
  dialog.searchParams.set("state", state);
  dialog.searchParams.set("response_type", "code");
  dialog.searchParams.set("scope", SCOPES.join(","));

  const response = NextResponse.redirect(dialog);
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const secure = proto ? proto === "https" : new URL(request.url).protocol === "https:";

  response.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 600,
  });

  return response;
}
