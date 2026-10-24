import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { metaGraph } from "@/lib/meta";

export const dynamic = "force-dynamic";

type PlaceSearch = {
  data?: {
    id: string;
    name: string;
    location?: { city?: string; country?: string; street?: string };
  }[];
};

/** Studio'dagi "Joylashuv qo'shish" uchun Facebook place qidiruvi */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    return NextResponse.json({ ok: false, items: [] }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ ok: true, items: [] });
  }

  const result = await metaGraph<PlaceSearch>("search", {
    params: {
      type: "place",
      q: query,
      fields: "id,name,location{city,country,street}",
      limit: "8",
    },
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.description, items: [] });
  }

  const items = (result.result.data ?? []).map((place) => ({
    id: place.id,
    name: place.name,
    place: [place.location?.street, place.location?.city, place.location?.country]
      .filter(Boolean)
      .join(", "),
  }));

  return NextResponse.json({ ok: true, items });
}
