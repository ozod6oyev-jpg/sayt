"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { loadArticles } from "@/app/actions/public";
import { Button } from "@/components/ui/button";
import { getDict, type Locale } from "@/lib/i18n";
import type { ArticleCardData } from "@/lib/article-view";
import { ArticleCard } from "./article-card";

export function LoadMoreArticles({
  initial,
  hasMore: initialHasMore,
  locale,
}: {
  initial: ArticleCardData[];
  hasMore: boolean;
  locale: Locale;
}) {
  const t = getDict(locale);
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const next = await loadArticles({ locale, page: page + 1 });
      setItems((current) => [...current, ...next.items]);
      setPage((current) => current + 1);
      setHasMore(next.hasMore);
    });
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((article) => (
          <ArticleCard key={article.id} article={article} locale={locale} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
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
