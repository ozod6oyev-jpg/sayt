import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMetaSettings, metaGraph } from "@/lib/meta";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Suggestion = { tag: string; uses: number; source: "local" | "instagram" };

/**
 * Hashtag bo'yicha taklif: avval o'z tariximizdagi teglar, keyin
 * Instagram'ning ig_hashtag_search qidiruvi. Harflar yozilganda chaqiriladi.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    return NextResponse.json({ ok: false, items: [] }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const raw = (params.get("q") ?? "").replace(/^#+/, "").trim();
  const platform = params.get("platform") === "fb" ? "fb" : params.get("platform") === "threads" ? "threads" : "ig";
  if (!raw) {
    return NextResponse.json({ ok: true, items: [] });
  }

  const found = new Map<string, Suggestion>();

  // 1) O'z postlarimizdagi teglar
  const posts = await prisma.socialPost.findMany({
    where:
      platform === "fb"
        ? { hashtagsFb: { contains: raw } }
        : platform === "threads"
          ? { hashtagsThreads: { contains: raw } }
          : { hashtags: { contains: raw } },
    select: { hashtags: true, hashtagsFb: true, hashtagsThreads: true },
    take: 100,
  });

  for (const post of posts) {
    const source =
      platform === "fb" ? post.hashtagsFb : platform === "threads" ? post.hashtagsThreads : post.hashtags;

    for (const tag of (source ?? "").split(/\s+/).filter(Boolean)) {
      const name = tag.replace(/^#+/, "");
      if (!name.toLowerCase().includes(raw.toLowerCase())) continue;

      const existing = found.get(name.toLowerCase());
      if (existing) existing.uses += 1;
      else found.set(name.toLowerCase(), { tag: name, uses: 1, source: "local" });
    }
  }

  // 2) Instagram hashtag qidiruvi (ulangan bo'lsa)
  const settings = await getMetaSettings();
  if (settings.igUserId && settings.pageToken) {
    const search = await metaGraph<{ data?: { id: string }[] }>("ig_hashtag_search", {
      params: { user_id: settings.igUserId, q: raw },
    });

    if (search.ok) {
      const ids = (search.result.data ?? []).slice(0, 5).map((item) => item.id);

      const names = await Promise.all(
        ids.map((id) =>
          metaGraph<{ name?: string }>(id, { params: { user_id: settings.igUserId! } }),
        ),
      );

      for (const item of names) {
        if (!item.ok) continue;
        const name = item.result.name?.replace(/^#+/, "");
        if (!name) continue;

        const existing = found.get(name.toLowerCase());
        if (existing) existing.source = "instagram";
        else found.set(name.toLowerCase(), { tag: name, uses: 0, source: "instagram" });
      }
    }
  }

  const items = [...found.values()]
    .sort((a, b) => b.uses - a.uses || a.tag.length - b.tag.length)
    .slice(0, 8);

  return NextResponse.json({ ok: true, items });
}
