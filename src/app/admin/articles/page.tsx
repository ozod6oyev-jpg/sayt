import Image from "next/image";
import Link from "next/link";
import { deleteArticle, toggleArticlePublished } from "@/app/actions/admin";
import { PublishedBadge } from "@/components/admin/status-badge";
import { getAdminCopy, getAdminScript } from "@/lib/admin-i18n";
import { articlesCopy } from "@/lib/admin-copy/articles";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AdminArticlesPage() {
  const c = await getAdminCopy(articlesCopy);
  const script = await getAdminScript();

  const categoryLabels: Record<string, string> = {
    bozor: c.catBozor,
    qollanma: c.catQollanma,
    ipoteka: c.catIpoteka,
    tahlil: c.catTahlil,
  };

  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{c.title}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {c.total.replace("{n}", String(articles.length))}
          </p>
        </div>
        <Link href="/admin/articles/new" className="btn-primary text-xs">
          + {c.newArticle}
        </Link>
      </div>

      <div className="card overflow-hidden">
        {articles.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-slate-500">{c.empty}</p>
            <Link href="/admin/articles/new" className="btn-primary mt-4 text-xs">
              {c.writeFirst}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{c.colCover}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colTitle}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colCategory}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colStatus}</th>
                  <th className="px-4 py-2.5 font-medium">{c.colDate}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{c.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((article) => (
                  <tr key={article.id} className="align-middle">
                    <td className="px-4 py-2">
                      <Image
                        src={article.coverImage}
                        alt={article.titleUz}
                        width={article.coverWidth}
                        height={article.coverHeight}
                        className="h-12 w-16 rounded-md object-cover"
                      />
                    </td>
                    <td className="max-w-[320px] px-4 py-2">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="line-clamp-2 font-medium text-slate-700 hover:text-brand-700"
                      >
                        {article.titleUz}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-400">{article.authorName}</p>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                      {categoryLabels[article.category] ?? article.category}
                    </td>
                    <td className="px-4 py-2">
                      <PublishedBadge published={article.published} script={script} />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500">
                      {formatDate(article.publishedAt, "uz")}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-3">
                        <form action={toggleArticlePublished.bind(null, article.id)}>
                          <button
                            type="submit"
                            className="text-xs font-medium text-slate-600 hover:underline"
                          >
                            {article.published ? c.hide : c.publish}
                          </button>
                        </form>
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="text-xs font-medium text-brand-700 hover:underline"
                        >
                          {c.edit}
                        </Link>
                        <form action={deleteArticle.bind(null, article.id)}>
                          <button
                            type="submit"
                            title={c.deleteTitle}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            {c.delete}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">{c.note}</p>
    </div>
  );
}
