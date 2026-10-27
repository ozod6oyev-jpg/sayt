import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMetaSettings, metaBaseUrl, metaOAuthUrls } from "@/lib/meta";

export const dynamic = "force-dynamic";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v21.0";

/** Facebook Login for Business konfiguratsiyasi (ruxsatlar Meta panelida) */
const LOGIN_CONFIG_ID = "1457237349623066";

/** Reklama uchun alohida ruxsatlar — Marketing API tokeni shu orqali olinadi */
const ADS_SCOPES = [
  "ads_read",
  "ads_management",
  "business_management",
  "pages_show_list",
  "pages_read_engagement",
];

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/kirish", metaBaseUrl()));
  }

  const settings = await getMetaSettings();
  if (!settings.appId || !settings.appSecret) {
    return NextResponse.redirect(new URL("/admin/meta/kanallar?meta=missing", metaBaseUrl()));
  }

  const adsMode = new URL(request.url).searchParams.get("mode") === "ads";

  const state = randomBytes(16).toString("hex");
  const dialog = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  dialog.searchParams.set("client_id", settings.appId);

  if (adsMode) {
    // Reklama uchun oddiy Facebook Login — aniq ruxsatlar ro'yxati bilan
    dialog.searchParams.set("scope", ADS_SCOPES.join(","));
  } else {
    dialog.searchParams.set("config_id", LOGIN_CONFIG_ID);
    dialog.searchParams.set("override_default_response_type", "true");
  }

  dialog.searchParams.set("response_type", "code");
  dialog.searchParams.set("redirect_uri", metaOAuthUrls().facebook);
  dialog.searchParams.set("state", state);

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

  if (adsMode) {
    response.cookies.set("meta_oauth_mode", "ads", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 600,
    });
  }

  return response;
}
