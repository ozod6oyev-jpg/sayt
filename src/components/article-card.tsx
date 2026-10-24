import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ArticleCardData } from "@/lib/article-view";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import { ArrowRightIcon } from "./icons";

export function ArticleCard({
  article,
  locale,
}: {
  article: ArticleCardData;
  locale: Locale;
}) {
  const t = getDict(locale);

  return (
    <Card className="group gap-0 overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float">
      <Link href={localePath(locale, `/blog/${article.slug}`)} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <Image
            src={article.cover.url}
            alt={article.title}
            width={article.cover.width}
            height={article.cover.height}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <Badge variant="glass" className="absolute top-3 left-3 shadow-sm">
            {article.categoryLabel}
          </Badge>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="line-clamp-2 text-base leading-6 font-semibold text-slate-900 transition-colors group-hover:text-brand-700">
            {article.title}
          </h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
            {article.excerpt}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span>{article.dateLabel}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
              {t.blog.readMore}
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
