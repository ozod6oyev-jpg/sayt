import Link from "next/link";
import { createArticle } from "@/app/actions/admin";
import { ArticleForm } from "@/components/admin/article-form";
import { articlesCopy } from "@/lib/admin-copy/articles";
import { getAdminCopy } from "@/lib/admin-i18n";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewArticlePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const c = await getAdminCopy(articlesCopy);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/articles" className="text-xs font-medium text-brand-700">
          ← {c.title}
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900">{c.newArticle}</h1>
        <p className="mt-1 text-sm text-slate-500">{c.newHint}</p>
      </div>

      <ArticleForm action={createArticle} error={error} />
    </div>
  );
}
