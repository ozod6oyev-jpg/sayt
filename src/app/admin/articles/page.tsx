import Image from "next/image";
import Link from "next/link";
import { deleteArticle, toggleArticlePublished } from "@/app/actions/admin";
import { PublishedBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export default async function AdminArticlesPage() {
  const t = getDict("uz");

  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.admin.articles}</h1>
          <p className="mt-0.5 text-sm text-slate-500">Jami: {articles.length} ta</p>
        </div>
        <Link href="/admin/articles/new" className="btn-primary text-xs">
          + {t.admin.newArticle}
        </Link>
      </div>

      <div className="card overflow-hidden">
        {articles.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-slate-500">Hozircha maqola yo'q.</p>
            <Link href="/admin/articles/new" className="btn-primary mt-4 text-xs">
              Birinchi maqolani yozish
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Muqova</th>
                  <th className="px-4 py-2.5 font-medium">Sarlavha</th>
                  <th className="px-4 py-2.5 font-medium">Kategoriya</th>
                  <th className="px-4 py-2.5 font-medium">Holat</th>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amallar</th>
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
                      {t.category[article.category] ?? article.category}
                    </td>
                    <td className="px-4 py-2">
                      <PublishedBadge published={article.published} />
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
                            {article.published ? "Yashirish" : "Nashr"}
                          </button>
                        </form>
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="text-xs font-medium text-brand-700 hover:underline"
                        >
                          {t.admin.edit}
                        </Link>
                        <form action={deleteArticle.bind(null, article.id)}>
                          <button
                            type="submit"
                            title="Maqola butunlay o'chiriladi"
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            {t.admin.delete}
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

      <p className="text-xs text-slate-500">
        Maqolalar Discover uchun asosiy manba. Kamida 1200px kenglikdagi muqova rasm
        ishlating.
      </p>
    </div>
  );
}
