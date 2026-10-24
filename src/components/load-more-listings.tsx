"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { loadListings } from "@/app/actions/public";
import type { SearchParams } from "@/components/search-form";
import { Button } from "@/components/ui/button";
import { getDict, type Locale } from "@/lib/i18n";
import type { ListingCardData } from "@/lib/listing-view";
import { ListingCard } from "./listing-card";

export function LoadMoreListings({
  initial,
  hasMore: initialHasMore,
  locale,
  filters,
}: {
  initial: ListingCardData[];
  hasMore: boolean;
  locale: Locale;
  filters?: SearchParams;
}) {
  const t = getDict(locale);
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const next = await loadListings({ locale, page: page + 1, filters });
      setItems((current) => [...current, ...next.items]);
      setPage((current) => current + 1);
      setHasMore(next.hasMore);
    });
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} locale={locale} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={pending}
            className="min-w-36"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? t.common.loading : t.common.loadMore}
          </Button>
        </div>
      )}
    </>
  );
}
