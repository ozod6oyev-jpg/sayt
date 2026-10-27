const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v21.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type MetaProfile = {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

/** Ko'rinmas belgilardan (\u3164 va h.k.) tozalab, haqiqiy ismni qaytaradi */
export function cleanName(value: string | null | undefined): string | null {
  const text = (value ?? "").replace(/[\u200b-\u200f\u3164\u2800\s]/g, "").trim();
  return /[\p{L}\p{N}]/u.test(text) ? (value ?? "").trim() : null;
}

/** Instagram yoki Facebook foydalanuvchi profili (page token bilan) */
export async function fetchProfile(
  platform: string,
  externalId: string,
  token: string,
): Promise<MetaProfile | null> {
  const fields =
    platform === "instagram" ? "name,username,profile_pic" : "first_name,last_name,profile_pic";

  try {
    const url = new URL(`${GRAPH}/${externalId}`);
    url.searchParams.set("fields", fields);

    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;

    const body = (await response.json().catch(() => null)) as
      | {
          name?: string;
          username?: string;
          first_name?: string;
          last_name?: string;
          profile_pic?: string;
          error?: unknown;
        }
      | null;

    if (!body || body.error) return null;

    if (platform === "instagram") {
      const username = body.username?.trim() || null;
      // Instagram'da ism ko'pincha ko'rinmas belgilardan iborat — u holda username
      return {
        username,
        displayName: cleanName(body.name) ?? username,
        avatarUrl: body.profile_pic ?? null,
      };
    }

    const displayName = [body.first_name, body.last_name].filter(Boolean).join(" ").trim() || null;
    return { username: null, displayName, avatarUrl: body.profile_pic ?? null };
  } catch {
    return null;
  }
}
