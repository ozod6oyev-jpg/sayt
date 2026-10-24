import type { Article } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { articleExcerpt, articleTitle } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import { ArrowRightIcon } from "./icons";

export function ArticleCard({ article, locale }: { article: Article; locale: Locale }) {
  const t = getDict(locale);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float">
      <Link href={localePath(locale, `/blog/${article.slug}`)} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <Image
            src={article.coverImage}
            alt={articleTitle(article, locale)}
            width={article.coverWidth}
            height={article.coverHeight}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-brand-800 backdrop-blur">
            {t.category[article.category] ?? article.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="line-clamp-2 text-base leading-6 font-semibold text-slate-900 transition-colors group-hover:text-brand-700">
            {articleTitle(article, locale)}
          </h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
            {articleExcerpt(article, locale)}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>{formatDate(article.publishedAt, locale)}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
              {t.blog.readMore}
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
