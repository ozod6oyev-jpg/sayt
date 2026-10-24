import Link from "next/link";
import { notFound } from "next/navigation";
import { updateArticle } from "@/app/actions/admin";
import { ArticleForm } from "@/components/admin/article-form";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditArticlePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;
  const saved = Array.isArray(query.saved) ? query.saved[0] : query.saved;

  const article = await prisma.article.findUnique({ where: { id } });

  if (!article) {
    notFound();
  }

  const t = getDict("uz");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/articles" className="text-xs font-medium text-brand-700">
            ← {t.admin.articles}
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{article.titleUz}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.admin.edit} · {article.slug}
          </p>
        </div>
        <Link
          href={`/uz/blog/${article.slug}`}
          className="btn-secondary text-xs"
          target="_blank"
        >
          Saytda ko'rish ↗
        </Link>
      </div>

      <ArticleForm
        action={updateArticle.bind(null, article.id)}
        article={article}
        error={error}
        saved={saved}
      />
    </div>
  );
}
