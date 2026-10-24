import type { Article } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { articleExcerpt, articleTitle } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { getDict, localePath, type Locale } from "@/lib/i18n";

export function ArticleCard({ article, locale }: { article: Article; locale: Locale }) {
  const t = getDict(locale);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
      <Link href={localePath(locale, `/blog/${article.slug}`)} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <Image
            src={article.coverImage}
            alt={articleTitle(article, locale)}
            width={article.coverWidth}
            height={article.coverHeight}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-700">
            {t.category[article.category] ?? article.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-brand-700">
            {articleTitle(article, locale)}
          </h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
            {articleExcerpt(article, locale)}
          </p>
          <p className="mt-3 text-xs text-slate-500">{formatDate(article.publishedAt, locale)}</p>
        </div>
      </Link>
    </article>
  );
}
