import Link from "next/link";
import { createArticle } from "@/app/actions/admin";
import { ArticleForm } from "@/components/admin/article-form";
import { getDict } from "@/lib/i18n";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewArticlePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const t = getDict("uz");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/articles" className="text-xs font-medium text-brand-700">
          ← {t.admin.articles}
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900">{t.admin.newArticle}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Matnni bo'sh qator bilan paragraflarga bo'ling. Muqova rasm 1200px+ bo'lsin.
        </p>
      </div>

      <ArticleForm action={createArticle} error={error} />
    </div>
  );
}
