import type { Article } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { articlesCopy } from "@/lib/admin-copy/articles";
import { getAdminCopy } from "@/lib/admin-i18n";

export async function ArticleForm({
  action,
  article,
  error,
  saved,
}: {
  action: (formData: FormData) => Promise<void>;
  article?: Article;
  error?: string;
  saved?: string;
}) {
  const c = await getAdminCopy(articlesCopy);
  const today = new Date().toISOString().slice(0, 10);

  const errorMessages: Record<string, string> = {
    required: c.errRequired,
    cover: c.errCover,
  };

  return (
    <form action={action} className="card space-y-6 p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessages[error] ?? c.errorGeneric}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">{c.saved}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="titleUz">
            {c.fieldTitleUz} *
          </label>
          <input
            id="titleUz"
            name="titleUz"
            required
            defaultValue={article?.titleUz}
            className="field"
            placeholder={c.placeholderTitle}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="titleRu">
            {c.fieldTitleRu} *
          </label>
          <input
            id="titleRu"
            name="titleRu"
            required
            defaultValue={article?.titleRu}
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="category">
            {c.fieldCategory}
          </label>
          <select
            id="category"
            name="category"
            defaultValue={article?.category ?? "qollanma"}
            className="field"
          >
            <option value="bozor">{c.catBozor}</option>
            <option value="qollanma">{c.catQollanma}</option>
            <option value="ipoteka">{c.catIpoteka}</option>
            <option value="tahlil">{c.catTahlil}</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="slug">
            {c.fieldSlug}
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={article?.slug}
            className="field"
            placeholder={c.placeholderSlug}
          />
        </div>

        <div>
          <label className="label" htmlFor="authorName">
            {c.fieldAuthorName} *
          </label>
          <input
            id="authorName"
            name="authorName"
            required
            defaultValue={article?.authorName}
            className="field"
            placeholder={c.placeholderAuthor}
          />
        </div>

        <div>
          <label className="label" htmlFor="authorRole">
            {c.fieldAuthorRole}
          </label>
          <input
            id="authorRole"
            name="authorRole"
            defaultValue={article?.authorRole}
            className="field"
            placeholder={c.placeholderAuthorRole}
          />
        </div>

        <div>
          <label className="label" htmlFor="publishedAt">
            {c.fieldPublishedAt}
          </label>
          <input
            id="publishedAt"
            name="publishedAt"
            type="date"
            defaultValue={article ? article.publishedAt.toISOString().slice(0, 10) : today}
            className="field"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="published"
              defaultChecked={article?.published ?? true}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {c.fieldPublished}
          </label>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {c.sectionExcerpt}
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="label" htmlFor="excerptUz">
              {c.fieldExcerptUz}
            </label>
            <textarea
              id="excerptUz"
              name="excerptUz"
              rows={3}
              defaultValue={article?.excerptUz}
              className="field"
              placeholder={c.placeholderExcerpt}
            />
          </div>
          <div>
            <label className="label" htmlFor="excerptRu">
              {c.fieldExcerptRu}
            </label>
            <textarea
              id="excerptRu"
              name="excerptRu"
              rows={3}
              defaultValue={article?.excerptRu}
              className="field"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {c.sectionBody}
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="label" htmlFor="bodyUz">
              {c.fieldBodyUz}
            </label>
            <textarea
              id="bodyUz"
              name="bodyUz"
              rows={14}
              defaultValue={article?.bodyUz}
              className="field min-h-[280px] font-mono text-[13px]"
            />
          </div>
          <div>
            <label className="label" htmlFor="bodyRu">
              {c.fieldBodyRu}
            </label>
            <textarea
              id="bodyRu"
              name="bodyRu"
              rows={14}
              defaultValue={article?.bodyRu}
              className="field min-h-[280px] font-mono text-[13px]"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {c.bodyHintStart}
          <code className="mx-1 rounded bg-slate-100 px-1">##</code>
          {c.bodyHintAnd}
          <code className="mx-1 rounded bg-slate-100 px-1">###</code>
          {c.bodyHintList}
          <code className="mx-1 rounded bg-slate-100 px-1">-</code>
          {c.bodyHintEnd}
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {c.sectionCover}
        </h2>

        {article && (
          <div className="mb-4 flex items-start gap-4">
            <Image
              src={article.coverImage}
              alt={article.titleUz}
              width={article.coverWidth}
              height={article.coverHeight}
              className="h-32 w-48 rounded-lg object-cover"
            />
            <p className="text-xs text-slate-500">{c.currentCover}</p>
          </div>
        )}

        <input
          name="cover"
          type="file"
          accept="image/*"
          required={!article}
          className="field file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
        />
        <p className="mt-2 text-xs text-slate-500">{c.coverHint}</p>
      </section>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-5">
        <button type="submit" className="btn-primary">
          {c.save}
        </button>
        <Link href="/admin/articles" className="btn-secondary">
          {c.cancel}
        </Link>
      </div>
    </form>
  );
}
